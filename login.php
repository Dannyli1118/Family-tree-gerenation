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
        throw new Exception("請輸入帳號與密碼！");
    }

    $username = trim($data['username']);
    $password = $data['password'];

    // 1. 去資料庫尋找這個帳號
    $result = $client->run("MATCH (u:User {username: \$username}) RETURN u.password AS hash", ['username' => $username]);
    
    if (count($result) === 0) {
        throw new Exception("找不到這個帳號，請先註冊！");
    }

    // 2. 取出資料庫裡的加密密碼
    $dbHash = $result->first()->get('hash');

    // 🌟 3. 驗證密碼是否正確
    if (password_verify($password, $dbHash)) {
        echo json_encode(['status' => 'success', 'message' => '登入成功！', 'username' => $username], JSON_UNESCAPED_UNICODE);
    } else {
        throw new Exception("密碼錯誤，請再試一次！");
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>