<?php
require_once 'vendor/autoload.php';
require_once 'db_config.php';
// require_once 'db_config.php'; // 如果你有做密碼設定檔，請解開這行並刪除下方的密碼

use Laudis\Neo4j\ClientBuilder;

// 1. 完善的 CORS 跨域防護 (解決瀏覽器阻擋問題)
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 攔截 OPTIONS 預檢請求，直接回傳成功
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json; charset=utf-8');

try {
    // 2. 建立連線 (記得替換密碼)
    $client = ClientBuilder::create()
        ->withDriver('default', $db_uri) 
        ->build();

    $jsonInput = file_get_contents('php://input');
    $data = json_decode($jsonInput, true);

    if (empty($data['name'])) {
        throw new Exception("必須提供要刪除的姓名！");
    }

    $name = $data['name'];

    // 3. 【防彈寫法 第一步】：先單純算算看這個人存不存在
    $checkCypher = "MATCH (n:Person {name: \$name}) RETURN count(n) as count";
    $checkResult = $client->run($checkCypher, ['name' => $name]);
    
    // 如果找不到人，就丟出錯誤
    if ($checkResult->first()->get('count') === 0) {
        throw new Exception("在資料庫中找不到名為 '{$name}' 的成員。");
    }

    // 4. 【防彈寫法 第二步】：確定有這個人，再毫不留情地刪除他與他的連線
    $deleteCypher = "MATCH (n:Person {name: \$name}) DETACH DELETE n";
    $client->run($deleteCypher, ['name' => $name]);

    echo json_encode([
        'status' => 'success',
        'message' => "已成功刪除 {$name} 及其所有的關係連線！"
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error', 
        'message' => $e->getMessage()
    ]);
}
?>