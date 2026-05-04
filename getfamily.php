<?php
// 載入 Composer 安裝的套件
require_once 'vendor/autoload.php';
use Laudis\Neo4j\ClientBuilder;

// 告訴瀏覽器這是一支回傳 JSON 格式的 API
header('Content-Type: application/json; charset=utf-8');
// 允許前端跨網域請求 (CORS) - 開發階段必備
header('Access-Control-Allow-Origin: *'); 

try {
    // 1. 建立連線 (請將 '你的密碼' 換成你剛剛在 Neo4j Desktop 設定的密碼)
    // Neo4j 預設使用 bolt 協定，port 為 7687
    $client = ClientBuilder::create()
        ->withDriver('default', 'bolt://neo4j:12345678@localhost:7687')
        ->build();

    // 2. 撰寫 Cypher 查詢語法 (這裡先簡單抓取所有 Person 節點)
    $cypher = "MATCH (p:Person) RETURN p.name AS name, p.birthYear AS birthYear";
    
    // 3. 執行查詢
    $results = $client->run($cypher);

    // 4. 將結果整理成 PHP 陣列
    $familyMembers = [];
    foreach ($results as $record) {
        $familyMembers[] = [
            'name' => $record->get('name'),
            'birthYear' => $record->get('birthYear')
        ];
    }

    // 5. 將陣列轉換成 JSON 格式並印出
    echo json_encode([
        'status' => 'success', 
        'data' => $familyMembers
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // 如果連線或查詢失敗，印出錯誤訊息
    echo json_encode([
        'status' => 'error', 
        'message' => $e->getMessage()
    ]);
}
?>