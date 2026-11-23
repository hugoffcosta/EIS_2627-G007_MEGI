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

class AuthService
{
    private UserDAL $users;

    public function __construct()
    {
        $this->users = new UserDAL();
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

    /** Login de um cliente. Devolve os dados públicos do utilizador. */
    public function loginClient(string $email, string $password): array
    {
        $email = trim($email);

        // 1. Validar os dados recebidos
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Enter a valid email address.');
        }
        if ($password === '') {
            throw new InvalidArgumentException('Password is required.');
        }

        // 2. Procurar o utilizador e verificar a password (encriptada com password_hash)
        $user = $this->users->findByEmail($email);
        if ($user === null || !password_verify($password, $user['password_hash'])) {
            // Mesma mensagem nos dois casos, para não revelar que emails existem
            throw new RuntimeException('Incorrect email or password.');
        }

        // 3. Confirmar que é mesmo um cliente
        if ($user['role'] !== 'client') {
            throw new RuntimeException('This account is not a client account. Use the correct login page.');
        }

        $profile = $this->users->findClientProfile((int) $user['user_id']);
        if ($profile === null) {
            throw new RuntimeException('Client profile not found.');
        }

        // 4. Guardar na sessão
        $this->startUserSession((int) $user['user_id'], 'client', $user['name'], $user['email'], [
            'client_id' => (int) $profile['client_id'],
        ]);

        return $this->currentUser();
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
    private function startUserSession(int $userId, string $role, string $name, string $email, array $extra = []): void
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
        if (empty($_SESSION['user_id'])) {
            return null;
        }

        return [
            'user_id' => $_SESSION['user_id'],
            'role'    => $_SESSION['role'],
            'name'    => $_SESSION['name'],
            'email'   => $_SESSION['email'],
        ];
    }
}
