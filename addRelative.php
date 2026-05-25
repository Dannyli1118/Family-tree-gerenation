<?php
require_once 'vendor/autoload.php';
require_once 'db_config.php'; 

use Laudis\Neo4j\ClientBuilder;

// 【防彈級 CORS 設定】
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS'); 
header('Access-Control-Allow-Headers: Content-Type, Authorization'); 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json; charset=utf-8');

try {
    // 1. 建立連線
    $client = ClientBuilder::create()
        ->withDriver('default', $db_uri)
        ->build();

    // 2. 接收前端資料
    $jsonInput = file_get_contents('php://input');
    
    if (empty($jsonInput)) {
        throw new Exception("沒有收到前端傳來的資料！");
    }

    $data = json_decode($jsonInput, true);

    if (empty($data['name'])) {
        throw new Exception("必須提供姓名！");
    }
    if (empty($data['username'])) {
    throw new Exception("缺少 username，無法判斷這個人物屬於哪個帳號！");
}

    // 🌟 【關鍵魔法】：從 "YYYY-MM-DD" 的生日中，切出前 4 個字元作為 birthYear
    // 這樣 D3.js 的高度物理引擎就能繼續正常運作，完全不用改前端畫圖邏輯！
    $birthYear = null;
    if (!empty($data['birthday'])) {
        $birthYear = (int) substr($data['birthday'], 0, 4);
    }

    // 3. 準備 Cypher 指令 (把新欄位全部加進去)
    $cypher = "
    CREATE (p:Person {
        username: \$username,
        name: \$name,
        gender: \$gender,
        birthday: \$birthday,
        birthYear: \$birthYear,
        location: \$location,
        income: \$income,
        hasIllness: \$hasIllness,
        isAlive: \$isAlive,
        photo: \$photo,
        phone: \$phone,   
        email: \$email
    })
    RETURN id(p)
    ";

    // 4. 發送給 Neo4j 執行 (對應所有新欄位，並加上防呆處理)
    $client->run($cypher, [
        'username' => $data['username'],
        'name' => trim($data['name']), 
        'gender' => $data['gender'] ?? '未知',
        'birthday' => $data['birthday'] ?? null,
        'birthYear' => $birthYear, // D3.js 需要的欄位
        'location' => trim($data['location'] ?? ''),
        'income' => (isset($data['income']) && $data['income'] !== '') ? (int)$data['income'] : null,
        'hasIllness' => $data['hasIllness'] ?? '無',
        'isAlive' => $data['isAlive'] ?? '是',
        'photo' => $data['photo'] ?? '',
        'phone' => $data['phone'] ?? '',  
        'email' => $data['email'] ?? ''
    ]);

    // 5. 回傳成功訊息
    echo json_encode([
        'status' => 'success',
        'message' => $data['name'] . ' 已成功加入家系圖！'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error', 
        'message' => "連線或寫入錯誤：" . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>