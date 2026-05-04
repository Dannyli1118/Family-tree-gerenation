<?php
require_once 'vendor/autoload.php';
require_once 'db_config.php'; // 確保這行有吃到你的雲端設定

use Laudis\Neo4j\ClientBuilder;

// 【防彈級 CORS 設定】
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS'); // 必須加上 OPTIONS
header('Access-Control-Allow-Headers: Content-Type, Authorization'); // 加上 Authorization 以防萬一

// 攔截 OPTIONS 預檢請求 (Preflight Request)，直接回傳 HTTP 200 成功狀態
// 這是解決「前端 fetch 遇到 CORS 錯誤」的關鍵
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 告訴前端我們回傳的是 JSON 格式
header('Content-Type: application/json; charset=utf-8');

try {
    // 1. 建立連線 (使用 db_config.php 裡面的 $db_uri)
    $client = ClientBuilder::create()
        ->withDriver('default', $db_uri)
        ->build();

    // 2. 接收前端資料
    $jsonInput = file_get_contents('php://input');
    
    // 如果沒有收到任何輸入，丟出錯誤
    if (empty($jsonInput)) {
        throw new Exception("沒有收到前端傳來的資料！");
    }

    $data = json_decode($jsonInput, true);

    // 確保前端有傳名字過來
    if (empty($data['name'])) {
        throw new Exception("必須提供姓名！");
    }

    // 3. 準備 Cypher 指令
    $cypher = "
        CREATE (p:Person {
            name: \$name, 
            gender: \$gender, 
            birthYear: \$birthYear
        }) 
        RETURN p
    ";

    // 4. 發送給 Neo4j 執行
    $client->run($cypher, [
        'name' => trim($data['name']), // trim() 幫助去除前後多餘的空白
        'gender' => $data['gender'] ?? '未知',
        'birthYear' => isset($data['birthYear']) && $data['birthYear'] !== '' ? (int)$data['birthYear'] : null 
        // 上面這行確保如果前端沒填年份，就存 null，而不是存 0 導致 D3.js 物理引擎計算錯誤
    ]);

    // 5. 回傳成功訊息給前端
    echo json_encode([
        'status' => 'success',
        'message' => $data['name'] . ' 已成功加入雲端家系圖！'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // 如果發生錯誤，回傳詳細錯誤訊息方便除錯
    echo json_encode([
        'status' => 'error', 
        'message' => "連線或寫入錯誤：" . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>