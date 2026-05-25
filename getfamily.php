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
    $username = $_GET['username'] ?? '';

    if ($username === '') {
        throw new Exception('缺少 username');
    }
    
    // 🌟 關鍵修改 1：在 Cypher 語句中，明確要求回傳 id(n) 並命名為 nodeId
    $resultNodes = $client->run(
        "MATCH (n:Person)
        WHERE n.username = \$username
        RETURN id(n) AS nodeId, n",
        ['username' => $username]
    );    

    foreach ($resultNodes as $record) {
        $node = $record->get('n');
        $nodeId = $record->get('nodeId'); // 🌟 關鍵修改 2：直接拿算好的 ID，不再呼叫報錯的 $node->id()
        
        // 將節點的所有屬性轉成 PHP 陣列
        $props = $node->getProperties()->toArray(); 

        $nodes[] = [
            'id' => $nodeId, // 👈 完美解決致命錯誤！
            
            // 以下是完整詳盡的個人資料
            'name' => $props['name'] ?? '未知',
            'gender' => $props['gender'] ?? '未知',
            'birthYear' => $props['birthYear'] ?? null,
            'birthday' => $props['birthday'] ?? '未知',
            'location' => $props['location'] ?? '未知',
            'income' => $props['income'] ?? '未知',
            'hasIllness' => $props['hasIllness'] ?? '無',
            'isAlive' => $props['isAlive'] ?? '是'
        ];
    }

    // 2. 撈取所有的親屬關係連線
    $linkResult = $client->run(
        "MATCH (a:Person)-[r]->(b:Person)
        WHERE a.username = \$username AND b.username = \$username
        RETURN id(a) AS source, id(b) AS target, type(r) AS type",
        ['username' => $username]
    );
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
