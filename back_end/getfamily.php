<?php
require_once 'vendor/autoload.php';
require_once 'db_config.php';
// 如果你有設定 db_config.php，請解開下面這行的註解，並刪除下一行的寫死連線
// require_once 'db_config.php'; 

use Laudis\Neo4j\ClientBuilder;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    // 建立連線 (請確認密碼正確)
    $client = ClientBuilder::create()
        ->withDriver('default', $db_uri) 
        ->build();

    // 1. 撈取所有的人物節點
    $nodeResult = $client->run('MATCH (n:Person) RETURN n');
    $nodes = [];
    foreach ($nodeResult as $record) {
        $node = $record->get('n');
        $props = $node->getProperties();
        // 為了 D3.js 畫圖方便，我們需要給每個節點一個唯一的 id
        // 這裡我們直接拿 Neo4j 內部的 id 當作唯一識別碼
        $nodes[] = [
            'id' => $node->getId(),
            'name' => $props['name'] ?? '未知',
            'gender' => $props['gender'] ?? '未知',
            'birthYear' => $props['birthYear'] ?? '未知'
        ];
    }

    // 2. 撈取所有的親屬關係連線
    $linkResult = $client->run('MATCH (a:Person)-[r]->(b:Person) RETURN id(a) AS source, id(b) AS target, type(r) AS type');
    $links = [];
    foreach ($linkResult as $record) {
        $links[] = [
            'source' => $record->get('source'),
            'target' => $record->get('target'),
            'type' => $record->get('type')
        ];
    }

    // 3. 把點(nodes)和線(links)打包成一個大物件回傳給前端
    echo json_encode([
        'status' => 'success',
        'data' => [
            'nodes' => $nodes,
            'links' => $links
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>