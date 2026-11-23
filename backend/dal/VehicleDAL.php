<?php
/**
 * Camada de Acesso a Dados (DAL) - veículos.
 */

require_once __DIR__ . '/Database.php';

class VehicleDAL
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /** true se já existir um veículo com esta matrícula. */
    public function plateExists(string $plate): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM vehicle WHERE license_plate = ?');
        $stmt->execute([$plate]);
        return (bool) $stmt->fetchColumn();
    }

    /** true se o tipo de veículo existir na tabela vehicle_type. */
    public function typeExists(string $typeName): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM vehicle_type WHERE type_name = ?');
        $stmt->execute([$typeName]);
        return (bool) $stmt->fetchColumn();
    }

    /** Cria um veículo (fica 'pending' até o staff aprovar). Devolve o vehicle_id. */
    public function create(array $v): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO vehicle
                (company_id, type_name, license_plate, brand, color, year, model, fuel_type,
                 max_weight_kg, max_vol_m3, registration_doc, inspection_expiry_doc, insurance_expiry_doc,
                 approval_status, operational_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \'pending\', \'inactive\')'
        );
        $stmt->execute([
            $v['company_id'],          // null se for de um estafeta independente
            $v['type_name'],
            $v['license_plate'],
            $v['brand'],
            $v['color'],
            $v['year'],
            $v['model'],
            $v['fuel_type'],
            $v['max_weight_kg'],
            $v['max_vol_m3'],
            $v['registration_doc'],
            $v['inspection_doc'],
            $v['insurance_doc'],
        ]);
        return (int) $this->db->lastInsertId();
    }

    /** Associa um veículo a um estafeta (tabela courier_vehicle). */
    public function linkToCourier(int $courierId, int $vehicleId): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO courier_vehicle (courier_id, vehicle_id, is_active) VALUES (?, ?, TRUE)'
        );
        $stmt->execute([$courierId, $vehicleId]);
    }
}
