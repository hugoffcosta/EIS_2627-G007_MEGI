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

    /** Perfil de estafeta (courier_id e estado de aprovação). */
    public function findCourierProfile(int $userId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT courier_id, company_id, approval_status
             FROM courier_profile
             WHERE user_id = ?'
        );
        $stmt->execute([$userId]);
        $profile = $stmt->fetch();

        return $profile ?: null;
    }

    /** Perfil de staff (staff_id e estado de aprovação). */
    public function findStaffProfile(int $userId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT staff_id, approval_status
             FROM staff_profile
             WHERE user_id = ?'
        );
        $stmt->execute([$userId]);
        $profile = $stmt->fetch();

        return $profile ?: null;
    }

    /** Perfil de administrador (admin_id). */
    public function findAdminProfile(int $userId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT admin_id
             FROM admin_profile
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
     * Cria uma linha em "user" e devolve o user_id.
     * Não abre transação: quem chama (a BLL) é que a controla.
     */
    public function createUser(array $user): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO user (username, email, password_hash, name, phone, nif, role)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $user['username'],
            $user['email'],
            $user['password_hash'],
            $user['name'],
            $user['phone'],
            $user['nif'],
            $user['role'],
        ]);
        return (int) $this->db->lastInsertId();
    }

    /** Cria o perfil de estafeta (fica 'pending' até o staff aprovar). Devolve o courier_id. */
    public function createCourierProfile(array $profile): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO courier_profile
                (user_id, company_id, address, postal_code, iban, approval_status,
                 profile_photo, iban_proof_doc, identity_doc, driving_license_doc,
                 criminal_record_doc, company_certificate_doc)
             VALUES (?, ?, ?, ?, ?, \'pending\', ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $profile['user_id'],
            $profile['company_id'],            // pode ser null (estafeta independente)
            $profile['address'],
            $profile['postal_code'],
            $profile['iban'],
            $profile['profile_photo'],         // os documentos podem ser null
            $profile['iban_proof_doc'],
            $profile['identity_doc'],
            $profile['driving_license_doc'],
            $profile['criminal_record_doc'],
            $profile['company_certificate_doc'],
        ]);
        return (int) $this->db->lastInsertId();
    }

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
