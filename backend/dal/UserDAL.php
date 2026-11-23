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

    // ------------------------------------------------------------------
    // LEITURA
    // ------------------------------------------------------------------

    /** Procura um utilizador pelo email. Devolve o utilizador ou null. */
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

    /** Devolve o perfil de cliente de um utilizador (client_id, tipo, empresa, morada, código postal). */
    public function findClientProfile(int $userId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT client_id, client_type, company_name, address, postal_code
             FROM client_profile
             WHERE user_id = ?'
        );
        $stmt->execute([$userId]);
        $profile = $stmt->fetch();

        return $profile ?: null;
    }

    /** true se já existir um utilizador com este email. */
    public function emailExists(string $email): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM user WHERE email = ?');
        $stmt->execute([$email]);
        return (bool) $stmt->fetchColumn();
    }

    /** true se já existir um utilizador com este NIF. */
    public function nifExists(string $nif): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM user WHERE nif = ?');
        $stmt->execute([$nif]);
        return (bool) $stmt->fetchColumn();
    }

    /** true se já existir um utilizador com este username. */
    public function usernameExists(string $username): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM user WHERE username = ?');
        $stmt->execute([$username]);
        return (bool) $stmt->fetchColumn();
    }

    // ------------------------------------------------------------------
    // ESCRITA
    // ------------------------------------------------------------------

    /**
     * Cria um cliente: uma linha em "user" e outra em "client_profile".
     * As duas inserções estão numa transação: ou ficam as duas gravadas, ou nenhuma.
     * Devolve o user_id e o client_id criados.
     */
    public function createClient(array $user, array $profile): array
    {
        $this->db->beginTransaction();

        try {
            $stmt = $this->db->prepare(
                'INSERT INTO user (username, email, password_hash, name, phone, nif, role)
                 VALUES (?, ?, ?, ?, ?, ?, \'client\')'
            );
            $stmt->execute([
                $user['username'],
                $user['email'],
                $user['password_hash'],
                $user['name'],
                $user['phone'],
                $user['nif'],          // pode ser null
            ]);
            $userId = (int) $this->db->lastInsertId();

            $stmt = $this->db->prepare(
                'INSERT INTO client_profile (user_id, client_type, company_name, address, postal_code)
                 VALUES (?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $userId,
                $profile['client_type'],
                $profile['company_name'],   // pode ser null
                $profile['address'],
                $profile['postal_code'],
            ]);
            $clientId = (int) $this->db->lastInsertId();

            $this->db->commit();

            return ['user_id' => $userId, 'client_id' => $clientId];
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
