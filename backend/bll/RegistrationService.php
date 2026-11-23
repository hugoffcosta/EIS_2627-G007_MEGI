<?php
/**
 * Camada de Lógica de Negócio (BLL) - registo de estafetas e empresas.
 *
 * Os dois registos chegam como formulário "multipart" (FormData), porque trazem ficheiros.
 * Ficam com approval_status = 'pending' até o staff aprovar, e por isso NÃO ficam autenticados.
 *
 * Exceções usadas (a API converte-as no código HTTP certo):
 *   InvalidArgumentException -> dados inválidos (400)
 *   DomainException          -> conflito, ex.: email já registado (409)
 */

require_once __DIR__ . '/../dal/Database.php';
require_once __DIR__ . '/../dal/UserDAL.php';
require_once __DIR__ . '/../dal/CompanyDAL.php';
require_once __DIR__ . '/../dal/VehicleDAL.php';
require_once __DIR__ . '/FileStorage.php';

class RegistrationService
{
    private UserDAL $users;
    private CompanyDAL $companies;
    private VehicleDAL $vehicles;
    private FileStorage $files;

    /** Combustível do formulário -> valor na BD */
    private const FUEL_MAP = ['diesel' => 'diesel', 'petrol' => 'gasoline', 'gas' => 'gas', 'electric' => 'electric'];

    public function __construct()
    {
        $this->users     = new UserDAL();
        $this->companies = new CompanyDAL();
        $this->vehicles  = new VehicleDAL();
        $this->files     = new FileStorage();
    }

    // ------------------------------------------------------------------
    // ESTAFETA
    // ------------------------------------------------------------------

    /**
     * Regista um estafeta, os seus veículos (opcionais) e os documentos.
     * $post = $_POST, $files = $_FILES
     */
    public function registerCourier(array $post, array $files): array
    {
        // 1. Dados pessoais
        $name     = trim($post['full_name'] ?? '');
        $email    = strtolower(trim($post['email'] ?? ''));
        $phone    = trim($post['phone'] ?? '');
        $nif      = trim($post['nif'] ?? '');
        $address  = trim($post['address'] ?? '');
        $district = trim($post['city'] ?? '');
        $postal   = trim($post['postal_code'] ?? '');
        $iban     = strtoupper(trim($post['iban'] ?? ''));
        $password = $post['password'] ?? '';
        $confirm  = $post['password_confirmation'] ?? '';
        $affiliated  = ($post['company_affiliation'] ?? 'no') === 'yes';
        $companyCode = strtoupper(trim($post['company_id'] ?? ''));

        if (mb_strlen($name) < 3 || preg_match('/[^\p{L}\p{M} ]/u', $name)) {
            throw new InvalidArgumentException('Full name must have at least 3 characters and contain only letters and spaces.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Enter a valid email address.');
        }
        $this->validatePassword($password, $confirm);
        if (!preg_match('/^[0-9]{9}$/', $phone)) {
            throw new InvalidArgumentException('Phone number must have 9 digits.');
        }
        if (!preg_match('/^[0-9]{9}$/', $nif)) {
            throw new InvalidArgumentException('NIF must have 9 digits.');
        }
        if ($address === '') {
            throw new InvalidArgumentException('Address is required.');
        }
        if (!preg_match('/^[0-9]{4}-[0-9]{3}$/', $postal)) {
            throw new InvalidArgumentException('Postal code must use the format 0000-000.');
        }
        if (!preg_match('/^[A-Z]{2}[0-9]+$/', $iban) || strlen($iban) > 34) {
            throw new InvalidArgumentException('IBAN must start with two uppercase letters followed by numbers, without spaces.');
        }

        // 2. Regras de negócio: email e NIF únicos; empresa tem de existir
        if ($this->users->emailExists($email)) {
            throw new DomainException('There is already an account with this email.');
        }
        if ($this->users->nifExists($nif)) {
            throw new DomainException('There is already an account with this NIF.');
        }
        $companyId = null;
        if ($affiliated) {
            if ($companyCode === '') {
                throw new InvalidArgumentException('Enter the Company ID of the company you work for.');
            }
            $company = $this->companies->findByCode($companyCode);
            if ($company === null) {
                throw new InvalidArgumentException('There is no company with this Company ID. Check the ID with your company.');
            }
            $companyId = (int) $company['company_id'];
        }

        // 3. Veículos (opcionais) - valida todos antes de gravar
        $vehicles = $this->readVehicles($post, $files);

        try {
            // 4. Guardar os documentos do estafeta
            $docs = [
                'profile_photo'           => $this->files->save($files['profile_photo'] ?? null, 'couriers', 'Profile photo', true),
                'iban_proof_doc'          => $this->files->save($files['iban_proof'] ?? null, 'couriers', 'IBAN proof'),
                'identity_doc'            => $this->files->save($files['identity_document'] ?? null, 'couriers', 'Identification document'),
                'driving_license_doc'     => $this->files->save($files['driving_license'] ?? null, 'couriers', 'Driving licence'),
                'criminal_record_doc'     => $this->files->save($files['criminal_record_document'] ?? null, 'couriers', 'Criminal record certificate'),
                'company_certificate_doc' => $affiliated
                    ? $this->files->save($files['company_certificate'] ?? null, 'couriers', 'Company affiliation certificate')
                    : null,
            ];
            $vehicles = $this->saveVehicleDocuments($vehicles);

            // 5. Gravar tudo numa transação: ou fica tudo gravado, ou nada
            Database::beginTransaction();

            $userId = $this->users->createUser([
                'username'      => $this->generateUsername($email),
                'email'         => $email,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                'name'          => $name,
                'phone'         => $phone,
                'nif'           => $nif,
                'role'          => 'courier',
            ]);

            $courierId = $this->users->createCourierProfile(array_merge([
                'user_id'     => $userId,
                'company_id'  => $companyId,
                // courier_profile não tem distrito: fica junto à morada
                'address'     => $district !== '' ? "$address, $district" : $address,
                'postal_code' => $postal,
                'iban'        => $iban,
            ], $docs));

            foreach ($vehicles as $vehicle) {
                $vehicle['company_id'] = null;   // veículo do próprio estafeta
                $vehicleId = $this->vehicles->create($vehicle);
                $this->vehicles->linkToCourier($courierId, $vehicleId);
            }

            Database::commit();
        } catch (Throwable $e) {
            Database::rollBack();
            $this->files->deleteSaved();   // não deixar ficheiros de um registo que falhou
            throw $e;
        }

        return ['courier_id' => $courierId, 'vehicles' => count($vehicles)];
    }

    // ------------------------------------------------------------------
    // EMPRESA
    // ------------------------------------------------------------------

    /** Regista uma empresa e a sua frota (opcional). Devolve o company_code gerado. */
    public function registerCompany(array $post, array $files): array
    {
        $name     = trim($post['company_name'] ?? '');
        $nif      = trim($post['company_nif'] ?? '');
        $email    = strtolower(trim($post['email'] ?? ''));
        $address  = trim($post['registered_office_address'] ?? '');
        $password = $post['password'] ?? '';
        $confirm  = $post['password_confirmation'] ?? '';

        if (mb_strlen($name) < 2) {
            throw new InvalidArgumentException('Company name is required.');
        }
        if (!preg_match('/^[0-9]{9}$/', $nif)) {
            throw new InvalidArgumentException('The company tax number must have 9 digits.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Enter a valid email address.');
        }
        if ($address === '') {
            throw new InvalidArgumentException('Registered office address is required.');
        }
        $this->validatePassword($password, $confirm);

        if ($this->companies->emailExists($email)) {
            throw new DomainException('There is already a company with this email.');
        }
        if ($this->companies->nifExists($nif)) {
            throw new DomainException('There is already a company with this tax number.');
        }

        $vehicles = $this->readVehicles($post, $files);

        try {
            $vehicles = $this->saveVehicleDocuments($vehicles);

            Database::beginTransaction();

            $code = $this->generateCompanyCode();
            $companyId = $this->companies->create([
                'company_code'  => $code,
                'company_name'  => $name,
                'email'         => $email,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                'nif_company'   => $nif,
                'address'       => $address,
            ]);

            foreach ($vehicles as $vehicle) {
                $vehicle['company_id'] = $companyId;   // frota da empresa
                $this->vehicles->create($vehicle);
            }

            Database::commit();
        } catch (Throwable $e) {
            Database::rollBack();
            $this->files->deleteSaved();
            throw $e;
        }

        return ['company_id' => $companyId, 'company_code' => $code, 'vehicles' => count($vehicles)];
    }

    // ------------------------------------------------------------------
    // AUXILIARES
    // ------------------------------------------------------------------

    /** Password: 8+ caracteres, uma maiúscula e um número (igual ao formulário). */
    private function validatePassword(string $password, string $confirm): void
    {
        if (strlen($password) < 8 || !preg_match('/\p{Lu}/u', $password) || !preg_match('/[0-9]/', $password)) {
            throw new InvalidArgumentException('Password must have at least 8 characters, one uppercase letter and one number.');
        }
        if ($password !== $confirm) {
            throw new InvalidArgumentException('The passwords do not match.');
        }
    }

    /**
     * Lê os veículos do formulário (vehicles[0][brand], vehicles[1][brand], ...).
     * Cartões vazios são ignorados. Devolve só os dados já validados.
     */
    private function readVehicles(array $post, array $files): array
    {
        $result = [];
        $plates = [];

        foreach ($post['vehicles'] ?? [] as $index => $v) {
            $v = array_map(fn($value) => is_string($value) ? trim($value) : $value, (array) $v);

            // Cartão vazio (o estafeta/empresa não quis registar veículo)
            $textFields = ['vehicle_type', 'brand', 'model', 'vehicle_color', 'vehicle_year', 'license_plate', 'fuel_type', 'max_weight', 'max_volume'];
            $hasData = false;
            foreach ($textFields as $field) {
                if (($v[$field] ?? '') !== '') { $hasData = true; break; }
            }
            if (!$hasData) {
                continue;
            }

            $n      = count($result) + 1;
            $type   = $v['vehicle_type'] ?? '';
            $plate  = strtoupper($v['license_plate'] ?? '');
            $fuel   = $v['fuel_type'] ?? '';
            $year   = $v['vehicle_year'] ?? '';
            $weight = str_replace(',', '.', $v['max_weight'] ?? '');
            $volume = str_replace(',', '.', $v['max_volume'] ?? '');

            if ($type === '' || !$this->vehicles->typeExists($type)) {
                throw new InvalidArgumentException("Vehicle $n: select a vehicle type.");
            }
            if (!preg_match('/^(?:[A-Z]{2}|[0-9]{2})-(?:[A-Z]{2}|[0-9]{2})-(?:[A-Z]{2}|[0-9]{2})$/', $plate)) {
                throw new InvalidArgumentException("Vehicle $n: use the licence plate format XX-XX-XX (e.g. AA-12-BB).");
            }
            if (in_array($plate, $plates, true)) {
                throw new InvalidArgumentException("Vehicle $n: this licence plate is repeated in the request.");
            }
            if ($this->vehicles->plateExists($plate)) {
                throw new DomainException("Vehicle $n: there is already a vehicle with the licence plate $plate.");
            }
            if (($v['brand'] ?? '') === '' || ($v['model'] ?? '') === '') {
                throw new InvalidArgumentException("Vehicle $n: brand and model are required.");
            }
            if (!preg_match('/^\d{4}$/', $year) || (int) $year < 2000 || (int) $year > 2026) {
                throw new InvalidArgumentException("Vehicle $n: enter a year between 2000 and 2026.");
            }
            if (!isset(self::FUEL_MAP[$fuel])) {
                throw new InvalidArgumentException("Vehicle $n: select a fuel type.");
            }
            if (!is_numeric($weight) || (float) $weight <= 0 || !is_numeric($volume) || (float) $volume <= 0) {
                throw new InvalidArgumentException("Vehicle $n: maximum weight and volume must be greater than zero.");
            }

            $plates[] = $plate;
            $result[] = [
                'type_name'     => $type,
                'license_plate' => $plate,
                'brand'         => $v['brand'],
                'model'         => $v['model'],
                'color'         => ($v['vehicle_color'] ?? '') !== '' ? $v['vehicle_color'] : null,
                'year'          => (int) $year,
                'fuel_type'     => self::FUEL_MAP[$fuel],
                'max_weight_kg' => (float) $weight,
                'max_vol_m3'    => (float) $volume,
                // ficheiros deste veículo (guardados mais tarde, em saveVehicleDocuments)
                'files' => [
                    'registration_doc' => $this->vehicleFile($files, $index, 'vehicle_registration_document'),
                    'inspection_doc'   => $this->vehicleFile($files, $index, 'vehicle_inspection_document'),
                    'insurance_doc'    => $this->vehicleFile($files, $index, 'vehicle_insurance_document'),
                ],
            ];
        }

        return $result;
    }

    /** Guarda os documentos de cada veículo e troca os ficheiros pelos caminhos guardados. */
    private function saveVehicleDocuments(array $vehicles): array
    {
        foreach ($vehicles as $i => $vehicle) {
            $n = $i + 1;
            $vehicles[$i]['registration_doc'] = $this->files->save($vehicle['files']['registration_doc'], 'vehicles', "Vehicle $n registration certificate");
            $vehicles[$i]['inspection_doc']   = $this->files->save($vehicle['files']['inspection_doc'], 'vehicles', "Vehicle $n inspection certificate");
            $vehicles[$i]['insurance_doc']    = $this->files->save($vehicle['files']['insurance_doc'], 'vehicles', "Vehicle $n insurance certificate");
            unset($vehicles[$i]['files']);
        }
        return $vehicles;
    }

    /**
     * Vai buscar um ficheiro de um veículo a $_FILES.
     * Com nomes como vehicles[0][vehicle_insurance_document], o PHP organiza $_FILES assim:
     *   $_FILES['vehicles']['name'][0]['vehicle_insurance_document']
     *   $_FILES['vehicles']['tmp_name'][0]['vehicle_insurance_document'] ...
     */
    private function vehicleFile(array $files, $index, string $field): ?array
    {
        if (!isset($files['vehicles']['error'][$index][$field])) {
            return null;
        }
        $file = [];
        foreach (['name', 'type', 'tmp_name', 'error', 'size'] as $key) {
            $file[$key] = $files['vehicles'][$key][$index][$field];
        }
        return $file;
    }

    /** Username a partir do email; se já existir acrescenta um número. */
    private function generateUsername(string $email): string
    {
        $base = preg_replace('/[^a-z0-9._]/', '', strstr($email, '@', true));
        $base = substr($base !== '' ? $base : 'user', 0, 45);

        $username = $base;
        $n = 2;
        while ($this->users->usernameExists($username)) {
            $username = $base . $n;
            $n++;
        }
        return $username;
    }

    /** Código único da empresa, ex.: COMP-2026-AB12CD34 */
    private function generateCompanyCode(): string
    {
        do {
            $code = 'COMP-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(4)));
        } while ($this->companies->codeExists($code));

        return $code;
    }
}
