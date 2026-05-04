<?php
require_once 'vendor/autoload.php';
use Laudis\Neo4j\ClientBuilder;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); 
// 允許前端發送 POST 請求
header('Access-Control-Allow-Methods: POST'); 
header('Access-Control-Allow-Headers: Content-Type');

try {
    // 1. 建立連線 (記得換成你的密碼)
    $client = ClientBuilder::create()
        ->withDriver('default', 'bolt://neo4j:12345678@localhost:7687')
        ->build();

    // 2. 【接收前端資料】取得前端傳來的 JSON 字串
    $jsonInput = file_get_contents('php://input');
    
    // 3. 【型態轉換】將 JSON 轉成 PHP 陣列
    $data = json_decode($jsonInput, true);

    // 確保前端有傳名字過來
    if (!isset($data['name'])) {
        throw new Exception("必須提供姓名！");
    }

    // 4. 【準備 Cypher 指令】
    // 注意：我們用 $name 和 $birthYear 作為「佔位符」，這叫參數化查詢，比較安全！
    $cypher = "
        CREATE (p:Person {
            name: \$name, 
            gender: \$gender, 
            birthYear: \$birthYear
        }) 
        RETURN p
    ";

    // 5. 【發送給 Neo4j】將資料陣列綁定到 Cypher 指令中執行
    $client->run($cypher, [
        'name' => $data['name'],
        'gender' => $data['gender'] ?? '未知', // 如果前端沒傳性別，預設為未知
        'birthYear' => (int)$data['birthYear'] // 確保年份是整數型態
    ]);

    // 6. 回傳成功訊息給前端
    echo json_encode([
        'status' => 'success',
        'message' => $data['name'] . ' 已成功加入家系圖！'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error', 
        'message' => $e->getMessage()
    ]);
}
?>