<?php
require_once 'vendor/autoload.php';
require_once 'db_config.php'; 

use Laudis\Neo4j\ClientBuilder;

header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS'); 
header('Access-Control-Allow-Headers: Content-Type'); 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
header('Content-Type: application/json; charset=utf-8');

try {
    $client = ClientBuilder::create()->withDriver('default', $db_uri)->build();
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['username']) || empty($data['password'])) {
        throw new Exception("帳號與密碼不能為空！");
    }

    $username = trim($data['username']);
    $password = $data['password'];

    // 1. 檢查帳號是否已經被註冊過
    $checkResult = $client->run("MATCH (u:User {username: \$username}) RETURN u", ['username' => $username]);
    if (count($checkResult) > 0) {
        throw new Exception("這個帳號已經被註冊過了喔！");
    }

    // 🌟 2. 業界標準：將密碼進行 Hash 加密 (絕對不要存明文！)
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // 3. 建立 User 節點
    $client->run("CREATE (u:User {username: \$username, password: \$hashedPassword})", [
        'username' => $username,
        'hashedPassword' => $hashedPassword
    ]);

    echo json_encode(['status' => 'success', 'message' => '帳號註冊成功！請登入。'], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>