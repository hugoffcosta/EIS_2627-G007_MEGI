<?php
/**
 * API REST de autenticação. Responde sempre em JSON.
 *
 *   POST api/auth.php?action=login     corpo JSON: {"role":"client|courier|company|staff|admin","email":"...","password":"..."}
 *   POST api/auth.php?action=register  corpo JSON: {"role":"client","name":"...","email":"...", ...}
 *   POST api/auth.php?action=logout
 *   GET  api/auth.php?action=me        devolve o utilizador autenticado (ou 401)
 */

require_once __DIR__ . '/../bll/AuthService.php';

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
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $role = $data['role'] ?? '';

        if ($role === 'client') {
            $user = $auth->registerClient($data);
            respond(201, ['ok' => true, 'user' => $user]);   // 201 = criado
        }

        // Os registos de estafeta e empresa vão ser acrescentados aqui
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
