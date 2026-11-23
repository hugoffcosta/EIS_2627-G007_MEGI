<?php
/**
 * Camada de Acesso a Dados (DAL) - empresas.
 *
 * As empresas têm login próprio (email e password na tabela "company"),
 * por isso não estão na tabela "user".
 */

require_once __DIR__ . '/Database.php';

class CompanyDAL
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /** Procura uma empresa pelo email. Devolve a empresa ou null. */
    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT company_id, company_name, email, password_hash, approval_status
             FROM company
             WHERE email = ?'
        );
        $stmt->execute([$email]);
        $company = $stmt->fetch();

        return $company ?: null;
    }
}
