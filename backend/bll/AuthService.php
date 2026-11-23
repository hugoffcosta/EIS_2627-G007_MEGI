<?php
/**
 * Camada de Lógica de Negócio (BLL) - autenticação e registo.
 *
 * Aqui ficam as regras: validar os dados, encriptar e verificar a password,
 * confirmar o role e guardar o utilizador na sessão.
 * Não tem SQL: pede os dados à DAL (UserDAL).
 *
 * Exceções usadas (a API converte-as no código HTTP certo):
 *   InvalidArgumentException -> dados inválidos (400)
 *   DomainException          -> conflito, ex.: email já registado (409)
 *   RuntimeException         -> login recusado (401)
 */

require_once __DIR__ . '/../dal/UserDAL.php';
require_once __DIR__ . '/../dal/CompanyDAL.php';

class AuthService
{
    private UserDAL $users;
    private CompanyDAL $companies;

    public function __construct()
    {
        $this->users     = new UserDAL();
        $this->companies = new CompanyDAL();
    }

    /** Inicia a sessão PHP, se ainda não estiver iniciada. */
    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    // ------------------------------------------------------------------
    // LOGIN
    // ------------------------------------------------------------------

    /**
     * Login de qualquer tipo de conta.
     * $role: 'client', 'courier', 'company', 'staff' ou 'admin'
     * Devolve os dados públicos do utilizador autenticado.
     */
    public function login(string $role, string $email, string $password): array
    {
        $email = trim($email);

        // 1. Validar os dados recebidos
        if (!in_array($role, ['client', 'courier', 'company', 'staff', 'admin'], true)) {
            throw new InvalidArgumentException('Unknown account type.');
        }
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Enter a valid email address.');
        }
        if ($password === '') {
            throw new InvalidArgumentException('Password is required.');
        }

        // 2. As empresas têm login próprio, na tabela "company"
        if ($role === 'company') {
            return $this->loginCompany($email, $password);
        }

        // 3. Procurar o utilizador e verificar a password (encriptada com password_hash)
        $user = $this->users->findByEmail($email);
        if ($user === null || !password_verify($password, $user['password_hash'])) {
            // Mesma mensagem nos dois casos, para não revelar que emails existem
            throw new RuntimeException('Incorrect email or password.');
        }

        // 4. Confirmar que a conta é do tipo da página de login usada
        if ($user['role'] !== $role) {
            $article = $role === 'admin' ? 'an' : 'a';
            throw new RuntimeException("This account is not $article $role account. Use the correct login page.");
        }

        // 5. Ler o perfil e aplicar as regras de aprovação de cada tipo
        $userId = (int) $user['user_id'];
        $extra  = [];

        switch ($role) {
            case 'client':
                $profile = $this->users->findClientProfile($userId);
                if ($profile === null) {
                    throw new RuntimeException('Client profile not found.');
                }
                $extra = ['client_id' => (int) $profile['client_id']];
                break;

            case 'courier':
                // O estafeta só entra depois de aprovado pelo staff
                $profile = $this->users->findCourierProfile($userId);
                if ($profile === null) {
                    throw new RuntimeException('Courier profile not found.');
                }
                $this->checkApproval($profile['approval_status'], 'our staff');
                $extra = [
                    'courier_id' => (int) $profile['courier_id'],
                    'company_id' => $profile['company_id'] !== null ? (int) $profile['company_id'] : null,
                ];
                break;

            case 'staff':
                // O staff só entra depois de aprovado pelo admin
                $profile = $this->users->findStaffProfile($userId);
                if ($profile === null) {
                    throw new RuntimeException('Staff profile not found.');
                }
                $this->checkApproval($profile['approval_status'], 'the administrator');
                $extra = ['staff_id' => (int) $profile['staff_id']];
                break;

            case 'admin':
                $profile = $this->users->findAdminProfile($userId);
                if ($profile === null) {
                    throw new RuntimeException('Admin profile not found.');
                }
                $extra = ['admin_id' => (int) $profile['admin_id']];
                break;
        }

        // 6. Guardar na sessão
        $this->startUserSession($userId, $role, $user['name'], $user['email'], $extra);

        return $this->currentUser();
    }

    /** Mantido para compatibilidade: login de cliente. */
    public function loginClient(string $email, string $password): array
    {
        return $this->login('client', $email, $password);
    }

    /** Login de uma empresa (tabela "company"). Só entra se estiver aprovada pelo staff. */
    private function loginCompany(string $email, string $password): array
    {
        $company = $this->companies->findByEmail($email);
        if ($company === null || !password_verify($password, $company['password_hash'])) {
            throw new RuntimeException('Incorrect email or password.');
        }

        $this->checkApproval($company['approval_status'], 'our staff');

        // As empresas não têm user_id: guarda-se o company_id
        $this->startUserSession(null, 'company', $company['company_name'], $company['email'], [
            'company_id' => (int) $company['company_id'],
        ]);

        return $this->currentUser();
    }

    /** Recusa o login de contas pendentes ou rejeitadas. */
    private function checkApproval(string $status, string $approvedBy): void
    {
        if ($status === 'pending') {
            throw new RuntimeException('Your account is still waiting for approval by ' . $approvedBy . '.');
        }
        if ($status !== 'approved') {
            throw new RuntimeException('Your registration was not approved. Please contact us for more information.');
        }
    }

    // ------------------------------------------------------------------
    // REGISTO
    // ------------------------------------------------------------------

    /**
     * Regista um cliente novo e deixa-o logo autenticado.
     * $data tem: name, email, phone, nif (opcional), client_type (individual/business),
     *            company_name (obrigatório se business), address, postal_code, city, password
     */
    public function registerClient(array $data): array
    {
        // 1. Limpar os dados recebidos
        $name     = trim($data['name'] ?? '');
        $email    = strtolower(trim($data['email'] ?? ''));
        $phone    = trim($data['phone'] ?? '');
        $nif      = trim($data['nif'] ?? '');
        $type     = strtolower(trim($data['client_type'] ?? ''));
        $company  = trim($data['company_name'] ?? '');
        $address  = trim($data['address'] ?? '');
        $postal   = trim($data['postal_code'] ?? '');
        $city     = trim($data['city'] ?? '');
        $password = $data['password'] ?? '';

        // 2. Validar (o browser já valida, mas o servidor nunca confia no browser)
        if (mb_strlen($name) < 3) {
            throw new InvalidArgumentException('Full name must have at least 3 characters.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Enter a valid email address.');
        }
        if (!preg_match('/^[0-9]{9}$/', $phone)) {
            throw new InvalidArgumentException('Phone number must have 9 digits.');
        }
        if ($nif !== '' && !preg_match('/^[0-9]{9}$/', $nif)) {
            throw new InvalidArgumentException('NIF must have 9 digits.');
        }
        if (!in_array($type, ['individual', 'business'], true)) {
            throw new InvalidArgumentException('Select a client type (Individual or Business).');
        }
        if ($type === 'business' && $company === '') {
            throw new InvalidArgumentException('Company name is required for business clients.');
        }
        if ($address === '' || $city === '') {
            throw new InvalidArgumentException('Street address and city are required.');
        }
        if (!preg_match('/^[0-9]{4}-[0-9]{3}$/', $postal)) {
            throw new InvalidArgumentException('Postal code must use the format 0000-000.');
        }
        if (strlen($password) < 8) {
            throw new InvalidArgumentException('Password must have at least 8 characters.');
        }

        // 3. Regras de negócio: email e NIF não podem estar repetidos
        if ($this->users->emailExists($email)) {
            throw new DomainException('There is already an account with this email.');
        }
        if ($nif !== '' && $this->users->nifExists($nif)) {
            throw new DomainException('There is already an account with this NIF.');
        }

        // 4. Gravar (a password é encriptada antes de ir para a BD)
        $ids = $this->users->createClient(
            [
                'username'      => $this->generateUsername($email),
                'email'         => $email,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                'name'          => $name,
                'phone'         => $phone,
                'nif'           => $nif === '' ? null : $nif,
            ],
            [
                'client_type'  => $type,
                'company_name' => $company === '' ? null : $company,
                // A tabela client_profile não tem cidade: fica junta à morada
                'address'     => $address . ', ' . $city,
                'postal_code' => $postal,
            ]
        );

        // 5. Deixar o cliente autenticado, para entrar logo no menu
        $this->startUserSession($ids['user_id'], 'client', $name, $email, [
            'client_id' => $ids['client_id'],
        ]);

        return $this->currentUser();
    }

    /**
     * Cria um username a partir do email (ex.: "sofia.lima@mail.pt" -> "sofia.lima").
     * Se já existir, acrescenta um número: "sofia.lima2", "sofia.lima3"...
     */
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

    // ------------------------------------------------------------------
    // SESSÃO
    // ------------------------------------------------------------------

    /** Guarda o utilizador na sessão (com um id de sessão novo, contra "session fixation"). */
    private function startUserSession(?int $userId, string $role, string $name, string $email, array $extra = []): void
    {
        self::startSession();
        session_regenerate_id(true);
        $_SESSION = array_merge([
            'user_id' => $userId,
            'role'    => $role,
            'name'    => $name,
            'email'   => $email,
        ], $extra);
    }

    /** Termina a sessão. */
    public function logout(): void
    {
        self::startSession();
        $_SESSION = [];
        session_destroy();
    }

    /** Devolve o utilizador autenticado (sem dados sensíveis) ou null. */
    public function currentUser(): ?array
    {
        self::startSession();
        if (empty($_SESSION['role'])) {
            return null;
        }

        return [
            'user_id'    => $_SESSION['user_id'] ?? null,      // null nas empresas
            'company_id' => $_SESSION['company_id'] ?? null,   // só empresas e estafetas de empresas
            'role'       => $_SESSION['role'],
            'name'       => $_SESSION['name'],
            'email'      => $_SESSION['email'],
        ];
    }
}
