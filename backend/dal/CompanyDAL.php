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
            'SELECT company_id, company_code, company_name, email, password_hash, approval_status
             FROM company
             WHERE email = ?'
        );
        $stmt->execute([$email]);
        $company = $stmt->fetch();

        return $company ?: null;
    }

    /** Procura uma empresa pelo código partilhado com os estafetas (ex.: COMP-2026-AB12CD34). */
    public function findByCode(string $code): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT company_id, company_code, company_name, approval_status
             FROM company
             WHERE company_code = ?'
        );
        $stmt->execute([$code]);
        $company = $stmt->fetch();

        return $company ?: null;
    }

    public function emailExists(string $email): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM company WHERE email = ?');
        $stmt->execute([$email]);
        return (bool) $stmt->fetchColumn();
    }

    public function nifExists(string $nif): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM company WHERE nif_company = ?');
        $stmt->execute([$nif]);
        return (bool) $stmt->fetchColumn();
    }

    public function codeExists(string $code): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM company WHERE company_code = ?');
        $stmt->execute([$code]);
        return (bool) $stmt->fetchColumn();
    }

    /** Cria uma empresa (fica 'pending' até o staff aprovar). Devolve o company_id. */
    public function create(array $company): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO company (company_code, company_name, email, password_hash, nif_company, address, approval_status)
             VALUES (?, ?, ?, ?, ?, ?, \'pending\')'
        );
        $stmt->execute([
            $company['company_code'],
            $company['company_name'],
            $company['email'],
            $company['password_hash'],
            $company['nif_company'],
            $company['address'],
        ]);
        return (int) $this->db->lastInsertId();
    }
}
