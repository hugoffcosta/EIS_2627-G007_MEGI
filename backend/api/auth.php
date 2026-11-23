<?php
/**
 * API REST de autenticação. Responde sempre em JSON.
 *
 *   POST api/auth.php?action=login     corpo JSON: {"role":"client|courier|company|staff|admin","email":"...","password":"..."}
 *   POST api/auth.php?action=register  cliente: corpo JSON {"role":"client","name":"...","email":"...", ...}
 *                                      estafeta/empresa: FormData (multipart, com ficheiros) e role=courier|company
 *   POST api/auth.php?action=logout
 *   GET  api/auth.php?action=me        devolve o utilizador autenticado (ou 401)
 */

require_once __DIR__ . '/../bll/AuthService.php';
require_once __DIR__ . '/../bll/RegistrationService.php';

header('Content-Type: application/json; charset=utf-8');

/** Envia uma resposta JSON com o código HTTP indicado e termina. */
function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$auth   = new AuthService();

try {
    // ---- LOGIN ----
    if ($method === 'POST' && $action === 'login') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $role = $data['role'] ?? '';

        // role: client, courier, company, staff ou admin
        $user = $auth->login($role, $data['email'] ?? '', $data['password'] ?? '');
        respond(200, ['ok' => true, 'user' => $user]);
    }

    // ---- REGISTO ----
    if ($method === 'POST' && $action === 'register') {
        // Estafeta e empresa enviam FormData (por causa dos ficheiros): os dados vêm em $_POST
        $role = $_POST['role'] ?? '';

        if ($role === 'courier') {
            $result = (new RegistrationService())->registerCourier($_POST, $_FILES);
            respond(201, ['ok' => true, 'status' => 'pending'] + $result);
        }

        if ($role === 'company') {
            $result = (new RegistrationService())->registerCompany($_POST, $_FILES);
            respond(201, ['ok' => true, 'status' => 'pending'] + $result);
        }

        // O cliente envia JSON
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (($data['role'] ?? '') === 'client') {
            $user = $auth->registerClient($data);
            respond(201, ['ok' => true, 'user' => $user]);   // 201 = criado
        }

        respond(400, ['ok' => false, 'error' => 'Unknown account type.']);
    }

    // ---- LOGOUT ----
    if ($method === 'POST' && $action === 'logout') {
        $auth->logout();
        respond(200, ['ok' => true]);
    }

    // ---- QUEM ESTÁ AUTENTICADO ----
    if ($method === 'GET' && $action === 'me') {
        $user = $auth->currentUser();
        if ($user === null) {
            respond(401, ['ok' => false, 'error' => 'Not authenticated.']);
        }
        respond(200, ['ok' => true, 'user' => $user]);
    }

    respond(404, ['ok' => false, 'error' => 'Endpoint not found.']);

} catch (PDOException $e) {
    // Erro da base de dados (tem de vir antes de RuntimeException, porque é um tipo dela)
    respond(500, ['ok' => false, 'error' => 'Database error. Check that MySQL is running.']);
} catch (InvalidArgumentException $e) {
    respond(400, ['ok' => false, 'error' => $e->getMessage()]);   // dados inválidos
} catch (DomainException $e) {
    respond(409, ['ok' => false, 'error' => $e->getMessage()]);   // conflito (ex.: email repetido)
} catch (RuntimeException $e) {
    respond(401, ['ok' => false, 'error' => $e->getMessage()]);   // credenciais erradas
} catch (Throwable $e) {
    respond(500, ['ok' => false, 'error' => 'Server error. Please try again.']);
}
