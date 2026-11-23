<?php
/**
 * Camada de Lógica de Negócio (BLL) - autenticação.
 *
 * Aqui ficam as regras: validar os dados, verificar a password,
 * confirmar o role e guardar o utilizador na sessão.
 * Não tem SQL: pede os dados à DAL (UserDAL).
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

    /**
     * Login de um cliente.
     * Devolve os dados públicos do utilizador, ou lança uma exceção com a mensagem de erro.
     */
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

        // 4. Guardar na sessão (novo id de sessão evita "session fixation")
        self::startSession();
        session_regenerate_id(true);
        $_SESSION['user_id']   = (int) $user['user_id'];
        $_SESSION['role']      = 'client';
        $_SESSION['client_id'] = (int) $profile['client_id'];
        $_SESSION['name']      = $user['name'];
        $_SESSION['email']     = $user['email'];

        return $this->currentUser();
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
