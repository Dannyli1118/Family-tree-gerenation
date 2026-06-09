<?php
require_once 'vendor/autoload.php';
require_once 'db_config.php';
use Laudis\Neo4j\ClientBuilder;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST'); 
header('Access-Control-Allow-Headers: Content-Type');

try {
    // 1. 建立連線 (記得替換密碼)
    $client = ClientBuilder::create()
        ->withDriver('default', $db_uri) 
        ->build();

    // 2. 接收前端傳來的資料：人物 A、人物 B、以及他們的關係
    $jsonInput = file_get_contents('php://input');
    $data = json_decode($jsonInput, true);

    if (
        empty($data['username']) ||
        empty($data['person1']) ||
        empty($data['person2']) ||
        empty($data['relation'])
    ) {
        throw new Exception("必須提供 username、雙方姓名與關係！");
    }
    $username = $data['username'];
    $person1 = $data['person1'];
    $person2 = $data['person2'];
    $relation = $data['relation'];

    // 3. 【資安防護】關係種類白名單
    // 在 Cypher 語法中，關係的名稱不能當作變數(參數)傳遞，必須直接寫死。
    // 為了防止壞人亂塞奇怪的指令，我們規定只能傳這兩種關係進來：
    $allowedRelations = [
        'PARENT_OF',
        'MARRIED_TO',
        'COHABITATION',
        'SEPARATED',
        'DIVORCED'
    ];
    if (!in_array($relation, $allowedRelations, true)) {
        throw new Exception("不支援的關係種類！");
    }

    // 4. 【準備 Cypher 指令】先 MATCH 找到兩個人，再 CREATE 建立連線
    if ($relation === 'PARENT_OF') {
        $cypher = "
            MATCH (a:Person {name: \$person1, username: \$username})
            MATCH (b:Person {name: \$person2, username: \$username})
            CREATE (a)-[r:PARENT_OF]->(b)
            RETURN type(r)
        ";
    } else if ($relation === 'MARRIED_TO' || $relation === 'DIVORCED') {
        $cypher = "
            MATCH (a:Person {name: \$person1, username: \$username})
            MATCH (b:Person {name: \$person2, username: \$username})

            OPTIONAL MATCH (a)-[old:MARRIED_TO|DIVORCED]-(b)
            DELETE old

            CREATE (a)-[r:$relation]->(b)
            RETURN type(r)
        ";
    } else if ($relation === 'COHABITATION' || $relation === 'SEPARATED') {
        $cypher = "
            MATCH (a:Person {name: \$person1, username: \$username})
            MATCH (b:Person {name: \$person2, username: \$username})

            OPTIONAL MATCH (a)-[old:COHABITATION|SEPARATED]-(b)
            DELETE old

            CREATE (a)-[r:$relation]->(b)
            RETURN type(r)
        ";
    }

    // 5. 執行指令，並把結果存進 $result 變數中
    $result = $client->run($cypher, [
        'username' => $username,
        'person1' => $person1,
        'person2' => $person2
    ]);

    // 6. 【關鍵防呆】檢查是否有真正回傳資料 (確認有沒有畫線成功)
    // $result->count() 如果是 0，代表 MATCH 沒找到人，導致 CREATE 沒執行
    if ($result->count() === 0) {
        throw new Exception("連線失敗：在資料庫中找不到帶有 Person 標籤的 '{$person1}' 或 '{$person2}'！");
    }

    echo json_encode([
        'status' => 'success',
        'message' => "成功建立 {$person1} 與 {$person2} 的關係！"
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error', 
        'message' => $e->getMessage()
    ]);
}
?>
