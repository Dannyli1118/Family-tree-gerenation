<?php
require_once 'vendor/autoload.php';
require_once 'db_config.php'; 

use Laudis\Neo4j\ClientBuilder;

header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS'); 
header('Access-Control-Allow-Headers: Content-Type, Authorization'); 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json; charset=utf-8');

try {
    $client = ClientBuilder::create()
        ->withDriver('default', $db_uri)
        ->build();

    $jsonInput = file_get_contents('php://input');
    if (empty($jsonInput)) throw new Exception("沒有收到前端傳來的資料！");

    $data = json_decode($jsonInput, true);

    // 🌟 防呆：確保有傳入目標的 ID 和必填的姓名
    if (empty($data['username'])) throw new Exception("缺少 username！");
    if (!isset($data['id']) || $data['id'] === '') throw new Exception("必須指定要修改的節點！");
    if (empty($data['name'])) throw new Exception("姓名不能為空！");

    $birthYear = null;
    if (!empty($data['birthday'])) {
        $birthYear = (int) substr($data['birthday'], 0, 4);
    }

    // 🌟 關鍵 Cypher：利用 id(p) 精準尋找，並用 SET 更新所有屬性
    $cypher = "
        MATCH (p:Person)
        WHERE id(p) = toInteger(\$id)
        AND p.username = \$username
        SET p.name = \$name, 
            p.gender = \$gender, 
            p.birthday = \$birthday,
            p.birthYear = \$birthYear,
            p.location = \$location,
            p.income = \$income,
            p.hasIllness = \$hasIllness,
            p.isAlive = \$isAlive,
            p.photo = \$photo,
            p.phone = \$phone,    
            p.email = \$email     
        RETURN id(p)
    ";

    $result = $client->run($cypher, [
        'username' => $data['username'],
        'id' => $data['id'],
        'name' => trim($data['name']), 
        'gender' => $data['gender'] ?? '未知',
        'birthday' => $data['birthday'] ?? null,
        'birthYear' => $birthYear, 
        'location' => trim($data['location'] ?? ''),
        'income' => (isset($data['income']) && $data['income'] !== '') ? (int)$data['income'] : null,
        'hasIllness' => $data['hasIllness'] ?? '無',
        'isAlive' => $data['isAlive'] ?? '是',
        'photo' => $data['photo'] ?? '',
        'phone' => $data['phone'] ?? '',   
        'email' => $data['email'] ?? ''    
    ]);

    if ($result->count() === 0) {
        throw new Exception("找不到這個使用者底下的指定人物，無法修改！");
    }

    echo json_encode([
        'status' => 'success',
        'message' => $data['name'] . ' 的資料已成功更新！'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error', 
        'message' => "修改錯誤：" . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>