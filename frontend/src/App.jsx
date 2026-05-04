import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './App.css';

function App() {
  const [familyData, setFamilyData] = useState([]);
  
  // 新增人物的 State
  const [name, setName] = useState('');
  const [gender, setGender] = useState('男');
  const [birthYear, setBirthYear] = useState('');

  // 建立關係的 State
  const [person1, setPerson1] = useState('');
  const [person2, setPerson2] = useState('');
  const [relation, setRelation] = useState('PARENT_OF');

  const svgRef = useRef();

  // 1. 抓取人物資料
  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost/family_tree/getFamily.php');
      const result = await res.json();
      if (result.status === 'success') {
        setFamilyData(result.data);
      }
    } catch (error) {
      console.error('抓取資料失敗', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. 新增人物
  const handleAddPerson = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost/family_tree/addRelative.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, gender, birthYear })
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert('🎉 ' + result.message);
        setName(''); setBirthYear('');
        fetchData(); 
      }
    } catch (error) {
      console.error('新增失敗', error);
    }
  };

  // 3. 【新功能】建立關係
  const handleAddRelation = async (e) => {
    e.preventDefault();
    if (person1 === person2) {
      alert('不能跟自己建立關係啦！');
      return;
    }
    try {
      const res = await fetch('http://localhost/family_tree/addRelationship.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person1, person2, relation })
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert('🔗 ' + result.message);
        // 清空選擇
        setPerson1(''); setPerson2('');
        // 等我們寫好抓取連線的 API 後，這裡可以重新 fetchData
      } else {
        alert('❌ 發生錯誤: ' + result.message);
      }
    } catch (error) {
      console.error('建立關係失敗', error);
    }
  };

  // D3.js 暫時畫圓圈的邏輯 (未包含連線畫法)
  useEffect(() => {
    if (familyData.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); 
    const width = 600; const height = 400;
    svg.attr('width', width).attr('height', height).style('background-color', '#f0f4f8').style('border-radius', '8px');
    
    const nodes = familyData.map((d, i) => ({
      ...d, x: 100 + (i * 80) % (width - 150), y: 100 + Math.floor(i / 5) * 80
    }));

    const nodeGroups = svg.selectAll('g').data(nodes).enter().append('g')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    nodeGroups.append('circle').attr('r', 30)
      .attr('fill', d => d.gender === '男' ? '#4dabf7' : d.gender === '女' ? '#ff8787' : '#ced4da')
      .attr('stroke', '#fff').attr('stroke-width', 2);

    nodeGroups.append('text').text(d => d.name).attr('text-anchor', 'middle').attr('dy', '.3em').style('fill', 'white').style('font-size', '14px');
  }, [familyData]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🌳 家族樹系統 (React 前端)</h1>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* 左側表單：新增人物 */}
        <div style={{ flex: 1, padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>1. 新增家族成員</h3>
          <form onSubmit={handleAddPerson} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div><label>姓名: </label><input value={name} onChange={e => setName(e.target.value)} required /></div>
            <div><label>性別: </label>
              <select value={gender} onChange={e => setGender(e.target.value)}>
                <option value="男">男</option><option value="女">女</option><option value="未知">未知</option>
              </select>
            </div>
            <div><label>出生年: </label><input type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)} /></div>
            <button type="submit">建立人物</button>
          </form>
        </div>

        {/* 右側表單：建立關係 */}
        <div style={{ flex: 1, padding: '15px', border: '1px solid #4dabf7', borderRadius: '8px', backgroundColor: '#e7f5ff' }}>
          <h3>2. 建立人物關係</h3>
          <form onSubmit={handleAddRelation} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label>人物 A: </label>
              <select value={person1} onChange={e => setPerson1(e.target.value)} required>
                <option value="">請選擇...</option>
                {familyData.map(p => <option key={`p1-${p.name}`} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label>是底下那位人物的: </label>
              <select value={relation} onChange={e => setRelation(e.target.value)}>
                <option value="PARENT_OF">父母 (父/母)</option>
                <option value="MARRIED_TO">配偶 (結婚)</option>
              </select>
            </div>
            <div>
              <label>人物 B: </label>
              <select value={person2} onChange={e => setPerson2(e.target.value)} required>
                <option value="">請選擇...</option>
                {familyData.map(p => <option key={`p2-${p.name}`} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <button type="submit" style={{ backgroundColor: '#228be6', color: 'white' }}>建立連線</button>
          </form>
        </div>
      </div>

      <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ccc' }}>
        <h3>家族圖譜 (D3.js 預覽 - 尚未畫線)</h3>
        {familyData.length === 0 ? <p>載入中或目前沒有資料...</p> : <svg ref={svgRef}></svg>}
      </div>
    </div>
  );
}

export default App;