<?php
/**
 * Camada de Acesso a Dados (DAL) - utilizadores.
 *
 * Só contém queries. Não decide nada (isso é trabalho da BLL).
 * Todas as queries usam parâmetros (?) para evitar SQL Injection.
 */

require_once __DIR__ . '/Database.php';

class UserDAL
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Procura um utilizador pelo email.
     * Devolve o utilizador (array) ou null se não existir.
     */
    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT user_id, username, email, password_hash, name, phone, nif, role, created_at
             FROM user
             WHERE email = ?'
        );
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    /**
     * Devolve o perfil de cliente de um utilizador (morada, código postal, client_id).
     */
    public function findClientProfile(int $userId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT client_id, address, postal_code
             FROM client_profile
             WHERE user_id = ?'
        );
        $stmt->execute([$userId]);
        $profile = $stmt->fetch();

        return $profile ?: null;
    }
}
