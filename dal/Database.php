<?php
/**
 * Camada de Acesso a Dados (DAL) - ligação PDO à base de dados.
 *
 * Usa o padrão Singleton: existe uma única ligação para todo o pedido.
 * Para a usar noutra classe:
 *
 *     require_once __DIR__ . '/Database.php';
 *     $db = Database::getConnection();
 *     $stmt = $db->prepare('SELECT * FROM user WHERE email = ?');
 *     $stmt->execute([$email]);
 *     $user = $stmt->fetch();
 *
 * Regra: usar SEMPRE prepare() + execute() com parâmetros.
 * Nunca juntar texto do utilizador diretamente na query (evita SQL Injection).
 */

require_once __DIR__ . '/../config/config.php';

class Database
{
    private static ?PDO $connection = null;

    // Impede que se crie "new Database()" fora da classe
    private function __construct() {}

    public static function getConnection(): PDO
    {
        if (self::$connection === null) {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;

            self::$connection = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // erros lançam exceções
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // resultados como arrays associativos
                PDO::ATTR_EMULATE_PREPARES   => false,                  // prepared statements reais
            ]);
        }

        return self::$connection;
    }
}
