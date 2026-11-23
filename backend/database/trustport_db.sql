-- =====================================================================
-- Trustport - Courier Management System (CMS)
-- EIS 2026/27 - Grupo 7 (MEGI) - Sprint 2
-- Script físico da base de dados (MySQL / MariaDB - XAMPP)
-- Baseado no DiagramaER_SIE_Group7
-- Versão 2 (23/11/2026): acrescenta o que o enunciado do Sprint 2 pede
--   - pricing_settings (preços definidos pelo admin)
--   - dispatch_offer (WP3 - propostas com 60 s)
--   - capacidade em vehicle_type (WP2)
--   - distância, re-pesagem/RTO (WP4) e código de entrega (WP5) em orders
--   - payment_type em payment (pagamento da encomenda ou do RTO)
--   - is_available em courier_profile (WP3)
-- Versão 3 (23/11/2026):
--   - client_type (individual/business) e company_name em client_profile
-- Versão 4 (23/11/2026): registo de estafeta e empresa
--   - company_code em company (ID que a empresa partilha com os estafetas)
--   - documentos do estafeta em courier_profile (foto, IBAN, CC, carta, registo criminal, certificado da empresa)
--   - registration_doc em vehicle e 'gas' no fuel_type
--
-- Como usar: phpMyAdmin -> separador "Importar" -> escolher este ficheiro -> "Executar"
-- Password de todos os utilizadores de teste: password123
-- =====================================================================

DROP DATABASE IF EXISTS trustport;
CREATE DATABASE trustport CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE trustport;

-- ---------------------------------------------------------------------
-- 1. UTILIZADORES E PERFIS
-- ---------------------------------------------------------------------

CREATE TABLE user (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    email          VARCHAR(100) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    name           VARCHAR(100) NOT NULL,
    phone          VARCHAR(20),
    nif            CHAR(9)      UNIQUE,
    role           ENUM('admin','staff','courier','client') NOT NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE admin_profile (
    admin_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id   INT NOT NULL UNIQUE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- O admin aprova o staff
CREATE TABLE staff_profile (
    staff_id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL UNIQUE,
    admin_id         INT NULL,
    birth_date       DATE,
    cc_number        VARCHAR(20),
    approval_status  ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    approved_at      DATETIME NULL,
    iban             VARCHAR(34),
    FOREIGN KEY (user_id)  REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin_profile(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE client_profile (
    client_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL UNIQUE,
    client_type  ENUM('individual','business') NOT NULL DEFAULT 'individual',
    company_name VARCHAR(150) NULL,               -- obrigatório quando client_type = 'business'
    address      VARCHAR(255),
    postal_code  VARCHAR(10),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- A empresa tem login próprio; o staff aprova a empresa
CREATE TABLE company (
    company_id       INT AUTO_INCREMENT PRIMARY KEY,
    company_code     VARCHAR(20) NULL UNIQUE,         -- ex.: COMP-2026-AB12CD34, partilhado com os estafetas
    staff_id         INT NULL,
    company_name     VARCHAR(150) NOT NULL,
    email            VARCHAR(100) NOT NULL UNIQUE,
    phone            VARCHAR(20),
    password_hash    VARCHAR(255) NOT NULL,
    nif_company      CHAR(9) NOT NULL UNIQUE,
    address          VARCHAR(255),
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approval_status  ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    approved_at      DATETIME NULL,
    FOREIGN KEY (staff_id) REFERENCES staff_profile(staff_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- O estafeta pode pertencer a uma empresa (ou ser independente: company_id NULL); o staff aprova-o
CREATE TABLE courier_profile (
    courier_id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL UNIQUE,
    company_id       INT NULL,
    staff_id         INT NULL,
    birth_date       DATE,
    cc_number        VARCHAR(20),
    license_number   VARCHAR(30),
    address          VARCHAR(255),
    postal_code      VARCHAR(10),
    approval_status  ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    approved_at      DATETIME NULL,
    iban             VARCHAR(34),
    is_available     BOOLEAN NOT NULL DEFAULT TRUE,   -- WP3: só recebe propostas se estiver disponível
    -- Documentos enviados no registo (caminho do ficheiro em backend/uploads)
    profile_photo            VARCHAR(255) NULL,
    iban_proof_doc           VARCHAR(255) NULL,
    identity_doc             VARCHAR(255) NULL,
    driving_license_doc      VARCHAR(255) NULL,
    criminal_record_doc      VARCHAR(255) NULL,
    company_certificate_doc  VARCHAR(255) NULL,
    FOREIGN KEY (user_id)    REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE SET NULL,
    FOREIGN KEY (staff_id)   REFERENCES staff_profile(staff_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE work_preference (
    preference_id  INT AUTO_INCREMENT PRIMARY KEY,
    courier_id     INT NOT NULL,
    regime_type    ENUM('full_time','part_time','weekends','flexible') NOT NULL,
    month          TINYINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year           SMALLINT NOT NULL,
    FOREIGN KEY (courier_id) REFERENCES courier_profile(courier_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. VEÍCULOS
-- ---------------------------------------------------------------------

-- WP2: o enunciado diz que o limite de capacidade vem do tipo de veículo
CREATE TABLE vehicle_type (
    type_name               VARCHAR(30) PRIMARY KEY,
    vehicle_certification   VARCHAR(100),
    max_weight_kg           DECIMAL(8,2) NOT NULL,
    max_vol_m3              DECIMAL(6,2) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE vehicle (
    vehicle_id              INT AUTO_INCREMENT PRIMARY KEY,
    company_id              INT NULL,
    type_name               VARCHAR(30) NOT NULL,
    staff_id                INT NULL,
    license_plate           VARCHAR(10) NOT NULL UNIQUE,
    brand                   VARCHAR(50),
    color                   VARCHAR(30),
    year                    SMALLINT,
    model                   VARCHAR(50),
    fuel_type               ENUM('gasoline','diesel','electric','hybrid','gas','none'),
    max_weight_kg           DECIMAL(8,2),
    max_vol_m3              DECIMAL(6,2),
    insurance_expiry_date   DATE,
    inspection_expiry_date  DATE,
    insurance_expiry_doc    VARCHAR(255),
    inspection_expiry_doc   VARCHAR(255),
    registration_doc        VARCHAR(255),                -- certificado de matrícula
    approval_status         ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    approved_at             DATETIME NULL,
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    operational_status      ENUM('available','in_use','maintenance','inactive') NOT NULL DEFAULT 'available',
    FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE SET NULL,
    FOREIGN KEY (type_name)  REFERENCES vehicle_type(type_name) ON UPDATE CASCADE,
    FOREIGN KEY (staff_id)   REFERENCES staff_profile(staff_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE courier_vehicle (
    courier_id   INT NOT NULL,
    vehicle_id   INT NOT NULL,
    assigned_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (courier_id, vehicle_id),
    FOREIGN KEY (courier_id) REFERENCES courier_profile(courier_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. PRODUTOS E ENCOMENDAS
-- ("order" é palavra reservada em SQL, por isso a tabela chama-se "orders")
-- ---------------------------------------------------------------------

CREATE TABLE product (
    product_id   INT AUTO_INCREMENT PRIMARY KEY,
    client_id    INT NOT NULL,
    category     VARCHAR(50),
    description  VARCHAR(255),
    weight_kg    DECIMAL(8,2),
    volume_m3    DECIMAL(6,3),
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES client_profile(client_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE orders (
    order_id                INT AUTO_INCREMENT PRIMARY KEY,
    client_id               INT NOT NULL,
    origin_lat              DECIMAL(9,6) NOT NULL,
    origin_long             DECIMAL(9,6) NOT NULL,
    dest_lat                DECIMAL(9,6) NOT NULL,
    dest_long               DECIMAL(9,6) NOT NULL,
    expected_delivery_time  DATETIME,
    distance_km             DECIMAL(8,2),                    -- distância por estrada (OSRM)
    service_type            ENUM('standard','express','same_day') NOT NULL DEFAULT 'standard',
    price                   DECIMAL(10,2) NOT NULL,
    order_status            ENUM('pending','paid','assigned','in_transit','delivered','failed','cancelled','rto','returned') NOT NULL DEFAULT 'pending',
    attempt                 TINYINT NOT NULL DEFAULT 0,
    -- WP4: re-pesagem e retorno à origem (RTO)
    actual_weight_kg        DECIMAL(8,2) NULL,               -- peso medido pelo estafeta na recolha
    rto_fee                 DECIMAL(10,2) NULL,              -- valor em falta que o cliente tem de pagar
    rto_reason              VARCHAR(255) NULL,               -- explicação mostrada ao cliente
    -- WP5: código de entrega (só obrigatório para equipas de 5)
    delivery_code           CHAR(6) NULL,
    code_validated_at       DATETIME NULL,
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES client_profile(client_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE order_product (
    order_id    INT NOT NULL,
    product_id  INT NOT NULL,
    quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id)   REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE payment (
    payment_id             INT AUTO_INCREMENT PRIMARY KEY,
    order_id               INT NOT NULL,
    payment_type           ENUM('order','rto') NOT NULL DEFAULT 'order',   -- pagamento da encomenda ou do valor em falta (WP4)
    payment_method         ENUM('card','mbway','paypal','multibanco') NOT NULL,
    payment_status         ENUM('pending','approved','declined','refunded') NOT NULL DEFAULT 'pending',
    transaction_reference  VARCHAR(100) UNIQUE,
    paid_at                DATETIME NULL,
    courier_amount         DECIMAL(10,2),
    comission_amount       DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE proof_of_delivery (
    pod_id        INT AUTO_INCREMENT PRIMARY KEY,
    order_id      INT NOT NULL UNIQUE,
    photo         VARCHAR(255),
    signature     VARCHAR(255),
    submitted_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE review (
    review_id   INT AUTO_INCREMENT PRIMARY KEY,
    order_id    INT NOT NULL UNIQUE,
    score       TINYINT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. ROTAS
-- ---------------------------------------------------------------------

CREATE TABLE route (
    route_id      INT AUTO_INCREMENT PRIMARY KEY,
    courier_id    INT NOT NULL,
    route_status  ENUM('initiated','in_progress','completed','cancelled') NOT NULL DEFAULT 'initiated',
    accepted_at   DATETIME NULL,
    started_at    DATETIME NULL,
    completed_at  DATETIME NULL,
    distance_km   DECIMAL(8,2),
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courier_id) REFERENCES courier_profile(courier_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE route_order (
    route_id          INT NOT NULL,
    order_id          INT NOT NULL,
    stop_sequence     INT NOT NULL,
    execution_status  ENUM('pending','delivered','failed') NOT NULL DEFAULT 'pending',
    delivered_at      DATETIME NULL,
    PRIMARY KEY (route_id, order_id),
    FOREIGN KEY (route_id) REFERENCES route(route_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE route_vehicle (
    route_id    INT NOT NULL,
    vehicle_id  INT NOT NULL,
    start_time  DATETIME NULL,
    end_time    DATETIME NULL,
    PRIMARY KEY (route_id, vehicle_id),
    FOREIGN KEY (route_id)   REFERENCES route(route_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE sos_incident (
    incident_id           INT AUTO_INCREMENT PRIMARY KEY,
    route_id              INT NOT NULL,
    staff_id              INT NULL,
    incident_type         ENUM('accident','breakdown','theft','health','other') NOT NULL,
    incident_description  TEXT,
    incident_lat          DECIMAL(9,6),
    incident_long         DECIMAL(9,6),
    reported_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status                ENUM('open','in_progress','resolved') NOT NULL DEFAULT 'open',
    resolved_at           DATETIME NULL,
    FOREIGN KEY (route_id) REFERENCES route(route_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff_profile(staff_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. DESPACHO (WP3) E PREÇOS
-- ---------------------------------------------------------------------

-- WP3: proposta enviada ao estafeta mais próximo, com 60 segundos para responder
CREATE TABLE dispatch_offer (
    offer_id      INT AUTO_INCREMENT PRIMARY KEY,
    order_id      INT NOT NULL,
    courier_id    INT NOT NULL,
    distance_km   DECIMAL(8,2),                    -- distância do estafeta ao ponto de recolha
    offered_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at    DATETIME NOT NULL,               -- offered_at + 60 segundos
    response      ENUM('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
    responded_at  DATETIME NULL,
    FOREIGN KEY (order_id)   REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (courier_id) REFERENCES courier_profile(courier_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Preços definidos pelo admin. A linha mais recente é a que está em vigor;
-- as anteriores ficam como histórico.
CREATE TABLE pricing_settings (
    setting_id  INT AUTO_INCREMENT PRIMARY KEY,
    admin_id    INT NULL,
    fee_base    DECIMAL(6,2) NOT NULL,    -- taxa fixa (€)
    rate_km     DECIMAL(6,2) NOT NULL,    -- € por km
    rate_kg     DECIMAL(6,2) NOT NULL,    -- € por kg faturável
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_profile(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. NOTIFICAÇÕES (para um utilizador OU para uma empresa)
-- ---------------------------------------------------------------------

CREATE TABLE notification_center (
    notification_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NULL,
    company_id       INT NULL,
    type             VARCHAR(50) NOT NULL,
    message          TEXT NOT NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)    REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =====================================================================
-- DADOS DE TESTE
-- Password de todos: password123
-- =====================================================================

SET @pw = '$2y$10$MmJzi3wCXtlr3WKJ/GXMPe5.n6Za/VP8GXEopuvKznUHyHxH4GU9e';

INSERT INTO user (user_id, username, email, password_hash, name, phone, nif, role) VALUES
(1, 'admin',      'admin@trustport.pt',      @pw, 'Administrador Trustport', '910000001', '200000001', 'admin'),
(2, 'staff.ana',  'ana.staff@trustport.pt',  @pw, 'Ana Ribeiro',             '910000002', '200000002', 'staff'),
(3, 'staff.rui',  'rui.staff@trustport.pt',  @pw, 'Rui Matos',               '910000003', '200000003', 'staff'),
(4, 'joao.silva', 'joao.silva@mail.pt',      @pw, 'João Silva',              '920000004', '200000004', 'courier'),
(5, 'marta.costa','marta.costa@mail.pt',     @pw, 'Marta Costa',             '920000005', '200000005', 'courier'),
(6, 'pedro.reis', 'pedro.reis@mail.pt',      @pw, 'Pedro Reis',              '920000006', '200000006', 'courier'),
(7, 'sofia.lima', 'sofia.lima@mail.pt',      @pw, 'Sofia Lima',              '930000007', '200000007', 'client'),
(8, 'tiago.melo', 'tiago.melo@mail.pt',      @pw, 'Tiago Melo',              '930000008', '200000008', 'client');

INSERT INTO admin_profile (admin_id, user_id) VALUES (1, 1);

INSERT INTO staff_profile (staff_id, user_id, admin_id, birth_date, cc_number, approval_status, approved_at, iban) VALUES
(1, 2, 1, '1990-04-12', '12345678 9ZZ1', 'approved', '2026-11-03 10:00:00', 'PT50000201231234567890154'),
(2, 3, NULL, '1995-09-30', '23456789 1ZZ2', 'pending', NULL,               'PT50000201231234567890155');

INSERT INTO client_profile (client_id, user_id, client_type, company_name, address, postal_code) VALUES
(1, 7, 'individual', NULL,                'Rua de Santa Catarina 100, Porto', '4000-447'),
(2, 8, 'business',   'Melo & Filhos, Lda', 'Avenida da Boavista 1500, Porto',  '4100-114');

INSERT INTO company (company_id, company_code, staff_id, company_name, email, phone, password_hash, nif_company, address, approval_status, approved_at) VALUES
(1, 'COMP-2026-RAPID001', 1,    'Rapid Porto Logística', 'geral@rapidporto.pt', '220000001', @pw, '500000001', 'Rua do Freixo 50, Porto',  'approved', '2026-11-04 09:30:00'),
(2, 'COMP-2026-NORTE002', NULL, 'Norte Express',         'info@norteexpress.pt','220000002', @pw, '500000002', 'Rua da Constituição 200, Porto', 'pending', NULL);

INSERT INTO courier_profile (courier_id, user_id, company_id, staff_id, birth_date, cc_number, license_number, address, postal_code, approval_status, approved_at, iban) VALUES
(1, 4, 1,    1,    '1998-02-15', '34567891 2ZZ3', 'P-1234567', 'Rua de Cedofeita 20, Porto', '4050-180', 'approved', '2026-11-05 11:00:00', 'PT50000201231234567890156'),
(2, 5, NULL, 1,    '2000-07-22', '45678912 3ZZ4', 'P-2345678', 'Rua do Bonjardim 300, Porto','4000-114', 'approved', '2026-11-05 11:15:00', 'PT50000201231234567890157'),
(3, 6, 1,    NULL, '1997-12-01', '56789123 4ZZ5', 'P-3456789', 'Rua de Camões 80, Porto',    '4000-144', 'pending',  NULL,                  'PT50000201231234567890158');

INSERT INTO work_preference (courier_id, regime_type, month, year) VALUES
(1, 'full_time', 11, 2026),
(2, 'part_time', 11, 2026),
(3, 'weekends',  12, 2026);

INSERT INTO vehicle_type (type_name, vehicle_certification, max_weight_kg, max_vol_m3) VALUES
('bicycle',    'Nenhuma',             15.00,  0.05),
('motorcycle', 'Carta categoria A',   30.00,  0.10),
('car',        'Carta categoria B',  300.00,  0.80),
('van',        'Carta categoria B',  800.00,  3.50),
('truck',      'Carta categoria C', 3500.00, 20.00);

INSERT INTO vehicle (vehicle_id, company_id, type_name, staff_id, license_plate, brand, color, year, model, fuel_type, max_weight_kg, max_vol_m3, insurance_expiry_date, inspection_expiry_date, approval_status, approved_at, operational_status) VALUES
(1, 1,    'van',        1,    'AA-12-BB', 'Renault', 'Branco',  2021, 'Kangoo', 'diesel',   800.00, 3.50, '2027-06-30', '2027-03-15', 'approved', '2026-11-05 12:00:00', 'available'),
(2, NULL, 'motorcycle', 1,    'CC-34-DD', 'Honda',   'Vermelho',2022, 'PCX 125','gasoline',  30.00, 0.10, '2027-01-31', '2027-05-20', 'approved', '2026-11-05 12:10:00', 'available'),
(3, 1,    'car',        NULL, 'EE-56-FF', 'Peugeot', 'Cinzento',2018, '208',    'gasoline', 300.00, 0.80, '2026-10-31', '2026-09-30', 'pending',  NULL,                  'inactive');

INSERT INTO courier_vehicle (courier_id, vehicle_id, is_active) VALUES
(1, 1, TRUE),
(2, 2, TRUE);

INSERT INTO product (product_id, client_id, category, description, weight_kg, volume_m3) VALUES
(1, 1, 'Eletrónica', 'Portátil 15 polegadas', 2.50, 0.010),
(2, 1, 'Livros',     'Caixa de livros',       8.00, 0.030),
(3, 2, 'Roupa',      'Encomenda de roupa',    1.20, 0.015),
(4, 2, 'Calçado',    'Caixa de sapatos',      1.20, 0.004);

-- Coordenadas reais no Porto (FEUP, Aliados, Boavista, Foz)
-- Preços calculados com a fórmula do enunciado:
-- 2,50 + km x 0,40 + MAX(peso real, volume x 200) x 0,30
INSERT INTO orders (order_id, client_id, origin_lat, origin_long, dest_lat, dest_long, distance_km, expected_delivery_time, service_type, price, order_status, attempt) VALUES
(1, 1, 41.178000, -8.596000, 41.148300, -8.611000, 4.20, '2026-11-18 18:00:00', 'express',  4.93, 'delivered',  1),
(2, 1, 41.148300, -8.611000, 41.157600, -8.629100, 2.80, '2026-11-19 12:00:00', 'standard',  8.42, 'in_transit', 1),
(3, 2, 41.157600, -8.629100, 41.151600, -8.674500, 4.10, '2026-11-20 17:00:00', 'standard',  5.04, 'pending',    0);

-- Exemplo de RTO (WP4): o cliente declarou 1,2 kg mas o estafeta mediu 6 kg
INSERT INTO orders (order_id, client_id, origin_lat, origin_long, dest_lat, dest_long, distance_km, expected_delivery_time, service_type, price, order_status, attempt, actual_weight_kg, rto_fee, rto_reason) VALUES
(4, 2, 41.151600, -8.674500, 41.178000, -8.596000, 9.50, '2026-11-24 15:00:00', 'standard', 6.66, 'rto', 1, 6.00, 5.24,
 'Peso real (6,00 kg) superior ao declarado (1,20 kg). Diferença de preço: 1,44 EUR + distância origem-destino: 3,80 EUR.');

INSERT INTO order_product (order_id, product_id, quantity) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 3, 1),
(4, 4, 1);

-- Divisão 50% estafeta / 50% Trustport (comissão)
INSERT INTO payment (order_id, payment_type, payment_method, payment_status, transaction_reference, paid_at, courier_amount, comission_amount) VALUES
(1, 'order', 'card',  'approved', 'MOCK-TX-0001', '2026-11-18 09:00:00', 2.47, 2.46),
(2, 'order', 'mbway', 'approved', 'MOCK-TX-0002', '2026-11-18 10:30:00', 4.21, 4.21),
(4, 'order', 'card',  'approved', 'MOCK-TX-0003', '2026-11-23 09:00:00', 3.33, 3.33),
(4, 'rto',   'card',  'pending',  NULL,           NULL,                  NULL, NULL);

INSERT INTO route (route_id, courier_id, route_status, accepted_at, started_at, completed_at, distance_km) VALUES
(1, 1, 'completed',   '2026-11-18 09:15:00', '2026-11-18 09:30:00', '2026-11-18 10:05:00', 4.20),
(2, 2, 'in_progress', '2026-11-18 11:00:00', '2026-11-18 11:10:00', NULL,                  2.80);

INSERT INTO route_order (route_id, order_id, stop_sequence, execution_status, delivered_at) VALUES
(1, 1, 1, 'delivered', '2026-11-18 10:05:00'),
(2, 2, 1, 'pending',   NULL);

INSERT INTO route_vehicle (route_id, vehicle_id, start_time, end_time) VALUES
(1, 1, '2026-11-18 09:30:00', '2026-11-18 10:05:00'),
(2, 2, '2026-11-18 11:10:00', NULL);

INSERT INTO proof_of_delivery (order_id, photo, signature, submitted_at) VALUES
(1, 'uploads/pod/order1.jpg', 'uploads/pod/order1_sig.png', '2026-11-18 10:05:00');

INSERT INTO review (order_id, score, comment) VALUES
(1, 5, 'Entrega rápida e estafeta muito simpático.');

INSERT INTO sos_incident (route_id, staff_id, incident_type, incident_description, incident_lat, incident_long, status) VALUES
(2, 1, 'breakdown', 'Pneu furado na Rua de Júlio Dinis.', 41.155000, -8.625000, 'in_progress');

INSERT INTO notification_center (user_id, company_id, type, message) VALUES
(4,    NULL, 'route',    'Foi-lhe atribuída uma nova rota.'),
(7,    NULL, 'delivery', 'A sua encomenda #1 foi entregue.'),
(NULL, 1,    'vehicle',  'O seguro do veículo EE-56-FF expirou.'),
(8,    NULL, 'rto',      'A encomenda #4 está retida: o peso real é superior ao declarado. Pague 5,24 EUR para continuar.'),
(3,    NULL, 'approval', 'O seu registo de staff aguarda aprovação.');

-- Preços em vigor (valores do exemplo do enunciado)
INSERT INTO pricing_settings (admin_id, fee_base, rate_km, rate_kg) VALUES
(1, 2.50, 0.40, 0.30);

-- WP3: a encomenda 2 foi proposta primeiro ao João (recusou) e depois à Marta (aceitou)
INSERT INTO dispatch_offer (order_id, courier_id, distance_km, offered_at, expires_at, response, responded_at) VALUES
(2, 1, 0.80, '2026-11-18 10:31:00', '2026-11-18 10:32:00', 'declined', '2026-11-18 10:31:25'),
(2, 2, 1.30, '2026-11-18 10:32:00', '2026-11-18 10:33:00', 'accepted', '2026-11-18 10:32:40');
