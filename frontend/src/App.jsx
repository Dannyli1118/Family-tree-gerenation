import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './App.css';

function App() {
  // ==========================================
  // 🔐 第一區塊：會員登入系統 State
  // ==========================================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(''); // 記住現在登入的是誰
  const [authMode, setAuthMode] = useState('login');  // 切換 'login' 或 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // ==========================================
  // 🌳 第二區塊：家族樹系統 State
  // ==========================================
  const [familyData, setFamilyData] = useState({ nodes: [], links: [] });
  
  // 1. 新增人物 State
  const [name, setName] = useState('');
  const [gender, setGender] = useState('男');
  const [birthday, setBirthday] = useState(''); 
  const [location, setLocation] = useState('');
  const [income, setIncome] = useState('');
  const [hasIllness, setHasIllness] = useState('無'); 
  const [isAlive, setIsAlive] = useState('是');       
  const [isAdding, setIsAdding] = useState(false); 

  // 2. 建立關係 State
  const [person1, setPerson1] = useState('');
  const [person2, setPerson2] = useState('');
  const [relation, setRelation] = useState('PARENT_OF');

  // 3. 刪除人物 State
  const [deleteName, setDeleteName] = useState('');

  // 4. 修改人物 State
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState('男');
  const [editBirthday, setEditBirthday] = useState(''); 
  const [editLocation, setEditLocation] = useState('');
  const [editIncome, setEditIncome] = useState('');
  const [editHasIllness, setEditHasIllness] = useState('無');
  const [editIsAlive, setEditIsAlive] = useState('是');
  const [isEditing, setIsEditing] = useState(false);

  const svgRef = useRef();

  // ==========================================
  // 🔐 登入/註冊 API 處理
  // ==========================================
  const handleAuth = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    const endpoint = authMode === 'login' ? 'login.php' : 'register.php';

    try {
      const res = await fetch(`http://localhost/family_tree/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const result = await res.json();
      
      if (result.status === 'success') {
        alert('✨ ' + result.message);
        if (authMode === 'login') {
            setIsLoggedIn(true);
            setCurrentUser(result.username);
            fetchData(); // 登入成功才去抓家族樹資料
        } else {
            // 註冊成功，自動切換到登入畫面，並清空密碼
            setAuthMode('login'); 
            setPassword('');
        }
      } else {
        alert('❌ 錯誤: ' + result.message);
      }
    } catch (error) {
      console.error('認證失敗', error);
      alert('系統發生錯誤！請確認 XAMPP 有啟動。');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 登出按鈕
  const handleLogout = () => {
      setIsLoggedIn(false);
      setCurrentUser('');
      setUsername('');
      setPassword('');
      setFamilyData({ nodes: [], links: [] }); // 清空機密資料
  };

  // ==========================================
  // 🌳 家族樹系統 API 處理
  // ==========================================
  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost/family_tree/getFamily.php', { cache: 'no-store' });
      const result = await res.json();
      if (result.status === 'success') setFamilyData(result.data);
    } catch (error) { console.error('抓取資料失敗', error); }
  };

  const handleAddPerson = async (e) => {
    e.preventDefault();
    setIsAdding(true); 
    try {
      const res = await fetch('http://localhost/family_tree/addRelative.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, gender, birthday, location, income, hasIllness, isAlive })
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert('🎉 ' + result.message);
        setName(''); setGender('男'); setBirthday(''); setLocation('');
        setIncome(''); setHasIllness('無'); setIsAlive('是');
        fetchData(); 
      } else { alert('❌ 發生錯誤: ' + result.message); }
    } catch (error) { alert('系統發生錯誤！'); } finally { setIsAdding(false); }
  };

  const handleAddRelation = async (e) => {
    e.preventDefault();
    if (person1 === person2) { alert('不能跟自己建立關係啦！'); return; }
    try {
      const res = await fetch('http://localhost/family_tree/addRelationship.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person1, person2, relation })
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert('🔗 ' + result.message);
        setPerson1(''); setPerson2(''); fetchData(); 
      } else { alert('❌ 發生錯誤: ' + result.message); }
    } catch (error) { console.error('建立關係失敗', error); }
  };

  const handleDeletePerson = async (e) => {
    e.preventDefault();
    if (!window.confirm(`確定要刪除「${deleteName}」嗎？這會同時刪除他所有的關係連線喔！`)) return;
    try {
      const res = await fetch('http://localhost/family_tree/deleteRelative.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deleteName })
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert('🗑️ ' + result.message);
        setDeleteName(''); fetchData(); 
      } else { alert('❌ 刪除失敗: ' + result.message); }
    } catch (error) { console.error('刪除失敗', error); }
  };

  const handleEditSelection = (e) => {
    const selectedId = e.target.value;
    setEditId(selectedId);
    if (!selectedId) {
        setEditName(''); setEditGender('男'); setEditBirthday(''); setEditLocation('');
        setEditIncome(''); setEditHasIllness('無'); setEditIsAlive('是'); return;
    }
    const targetNode = familyData.nodes.find(n => String(n.id) === String(selectedId));
    if (targetNode) {
        setEditName(targetNode.name || ''); setEditGender(targetNode.gender || '未知');
        setEditBirthday(targetNode.birthday === '未知' ? '' : targetNode.birthday || '');
        setEditLocation(targetNode.location === '未知' ? '' : targetNode.location || '');
        setEditIncome(targetNode.income === '未知' ? '' : targetNode.income || '');
        setEditHasIllness(targetNode.hasIllness || '無'); setEditIsAlive(targetNode.isAlive || '是');
    }
  };

  const handleEditPerson = async (e) => {
    e.preventDefault();
    if (!editId) return;
    setIsEditing(true); 
    try {
      const res = await fetch('http://localhost/family_tree/editRelative.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, name: editName, gender: editGender, birthday: editBirthday, location: editLocation, income: editIncome, hasIllness: editHasIllness, isAlive: editIsAlive })
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert('✨ ' + result.message);
        setEditId(''); setEditName(''); setEditGender('男'); setEditBirthday(''); 
        setEditLocation(''); setEditIncome(''); setEditHasIllness('無'); setEditIsAlive('是');
        fetchData(); 
      } else { alert('❌ 修改失敗: ' + result.message); }
    } catch (error) { alert('系統發生錯誤！'); } finally { setIsEditing(false); }
  };

  // ==========================================
  // 🎨 D3.js 防彈無向圖畫圖邏輯
  // ==========================================
  useEffect(() => {
    if (!isLoggedIn || !familyData || !familyData.nodes || familyData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    d3.select("body").selectAll(".d3-tooltip").remove(); 
    
    const tooltip = d3.select("body").append("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute").style("visibility", "hidden")
      .style("background-color", "rgba(255, 255, 255, 0.95)").style("border", "1px solid #ced4da")
      .style("border-radius", "8px").style("padding", "15px")
      .style("box-shadow", "0px 4px 12px rgba(0, 0, 0, 0.15)").style("pointer-events", "none")
      .style("font-size", "14px").style("line-height", "1.5").style("z-index", "1000"); 
      
    const width = 800; const height = 500;
    svg.attr('width', '100%').attr('height', height).attr('viewBox', [0, 0, width, height])
       .style('background-color', '#f8f9fa').style('border-radius', '8px');

    const nodes = familyData.nodes.map(d => Object.create(d));
    const links = familyData.links.map(d => Object.create(d));

    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(String(n.id), { generation: undefined }));
    
    const adj = new Map();
    nodes.forEach(n => adj.set(String(n.id), []));
    
    links.forEach(l => {
        const s = String(typeof l.source === 'object' ? l.source.id : l.source);
        const t = String(typeof l.target === 'object' ? l.target.id : l.target);
        const type = l.type || l.label || l.relation || 'PARENT_OF';
        
        if (adj.has(s) && adj.has(t)) {
            if (type === 'PARENT_OF') {
                adj.get(s).push({ to: t, weight: 1 });  
                adj.get(t).push({ to: s, weight: -1 }); 
            } else if (type === 'MARRIED_TO') {
                adj.get(s).push({ to: t, weight: 0 });  
                adj.get(t).push({ to: s, weight: 0 });
            }
        }
    });

    nodes.forEach(startNode => {
        const startId = String(startNode.id);
        if (nodeMap.get(startId).generation === undefined) {
            nodeMap.get(startId).generation = 0; 
            const queue = [startId];
            
            while (queue.length > 0) {
                const curr = queue.shift();
                const currGen = nodeMap.get(curr).generation;
                
                adj.get(curr).forEach(edge => {
                    const targetData = nodeMap.get(edge.to);
                    if (targetData && targetData.generation === undefined) {
                        targetData.generation = currGen + edge.weight;
                        queue.push(edge.to);
                    }
                });
            }
        }
    });

    const validGens = Array.from(nodeMap.entries())
        .filter(([id, data]) => adj.get(id) && adj.get(id).length > 0)
        .map(([id, data]) => data.generation);
        
    const minGen = validGens.length > 0 ? Math.min(...validGens) : 0;
    const maxGen = validGens.length > 0 ? Math.max(...validGens) : 0;
    const totalGens = maxGen - minGen + 1; 

    const validYears = nodes.map(d => {
        const y = parseInt(d.birthYear || (d.birthday ? String(d.birthday).substring(0, 4) : 0));
        return isNaN(y) ? 0 : y;
    }).filter(y => y > 0);
    const minYear = validYears.length > 0 ? Math.min(...validYears) : 1900;
    const maxYear = validYears.length > 0 ? Math.max(...validYears) : 2020;

    nodes.forEach(d => {
        const nodeData = nodeMap.get(String(d.id));
        const gen = nodeData ? nodeData.generation : undefined;
        const hasLinks = adj.get(String(d.id)) && adj.get(String(d.id)).length > 0;
        
        if (gen !== undefined && hasLinks) {
            if (totalGens === 1) {
                d.fy = height / 2;
            } else {
                const ratio = (gen - minGen) / (totalGens - 1);
                d.fy = 100 + ratio * (height - 200); 
            }
        } else {
            const year = parseInt(d.birthYear || (d.birthday ? String(d.birthday).substring(0, 4) : 0));
            if (!isNaN(year) && year > 0 && maxYear > minYear) {
                const ratio = (year - minYear) / (maxYear - minYear);
                d.fy = 80 + ratio * (height - 160); 
            } else {
                d.fy = height / 2; 
            }
        }
    });

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-800))
        .force("x", d3.forceX(width / 2).strength(0.05));

    const link = svg.append("g").attr("fill", "none").attr("stroke", "#adb5bd").attr("stroke-width", 2)
        .selectAll("path").data(links).join("path");

    const drag = d3.drag()
        .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; 
        })
        .on("drag", (event, d) => { d.fx = Math.max(30, Math.min(width - 30, event.x)); })
        .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); });

    const node = svg.append("g").selectAll("g").data(nodes).join("g")
      .call(drag).style('cursor', 'grab')
      .on("mouseover", (event, d) => {
        tooltip.html(`
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px; color: #343a40;">👤 ${d.name}</div>
          <div style="color: #495057;">
            <div><strong>性別：</strong>${d.gender || '未知'}</div>
            <div><strong>生日：</strong>${d.birthday || '未知'}</div>
            <div><strong>地點：</strong>${d.location || '未知'}</div>
            <div><strong>收入：</strong>${d.income ? `$${d.income}` : '未知'}</div>
            <div><strong>身心疾病：</strong><span style="color: ${d.hasIllness === '有' ? '#e03131' : '#2b8a3e'}">${d.hasIllness || '無'}</span></div>
            <div><strong>狀態：</strong>${d.isAlive || '是'}</div>
          </div>
        `);
        tooltip.style("visibility", "visible");
      })
      .on("mousemove", (event) => { tooltip.style("top", (event.pageY + 15) + "px").style("left", (event.pageX + 15) + "px"); })
      .on("mouseout", () => { tooltip.style("visibility", "hidden"); });
      
    node.each(function(d) {
        const group = d3.select(this);
        if (d.gender === '男') { group.append("rect").attr("x", -25).attr("y", -25).attr("width", 50).attr("height", 50).attr("fill", "#74c0fc").attr("stroke", "#fff").attr("stroke-width", 3); } 
        else if (d.gender === '女') { group.append("circle").attr("r", 28).attr("fill", "#ffc9c9").attr("stroke", "#fff").attr("stroke-width", 3); } 
        else { group.append("circle").attr("r", 28).attr("fill", "#e9ecef").attr("stroke", "#fff").attr("stroke-width", 3); }
    });

    node.append("text").text(d => d.name).attr('text-anchor', 'middle').attr('dy', '.3em').style('fill', '#343a40').style('font-weight', 'bold').style('font-size', '15px');

    simulation.on("tick", () => {
        link.attr("d", d => {
            if (d.source.x === undefined || d.target.x === undefined) return "";
            const midY = (d.source.y + d.target.y) / 2;
            return `M${d.source.x},${d.source.y} L${d.source.x},${midY} L${d.target.x},${midY} L${d.target.x},${d.target.y}`;
        });
        node.attr("transform", d => `translate(${d.x}, ${d.y})`);
    });
  }, [familyData, isLoggedIn]); // 🌟 當登入狀態改變時，重新畫圖


  // ==========================================
  // 🚪 畫面渲染邏輯 (未登入 vs 已登入)
  // ==========================================

  // 【情況 A：還沒登入，顯示登入/註冊畫面】
  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f3f5' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ textAlign: 'center', color: '#2b8a3e', marginTop: 0 }}>🌳 家族樹系統</h2>
          <h3 style={{ textAlign: 'center', color: '#495057' }}>{authMode === 'login' ? '會員登入' : '註冊新帳號'}</h3>
          
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>帳號：</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>密碼：</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box' }} />
            </div>
            
            <button type="submit" disabled={isAuthLoading} style={{ padding: '12px', backgroundColor: '#40c057', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: isAuthLoading ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
              {isAuthLoading ? '處理中...' : (authMode === 'login' ? '登入' : '註冊')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <span style={{ color: '#868e96', fontSize: '14px' }}>
              {authMode === 'login' ? '還沒有帳號嗎？' : '已經有帳號了？'}
            </span>
            <button 
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setPassword(''); }} 
              style={{ background: 'none', border: 'none', color: '#228be6', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}>
              {authMode === 'login' ? '點我註冊' : '點我登入'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 【情況 B：已經登入，顯示主要系統畫面】
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 頁首與登出按鈕 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e9ecef', paddingBottom: '10px' }}>
        <h1 style={{ color: '#2b8a3e', margin: 0 }}>🌳 互動式家族樹系統</h1>
        <div>
            <span style={{ marginRight: '15px', color: '#495057', fontWeight: 'bold' }}>歡迎，{currentUser} 👋</span>
            <button onClick={handleLogout} style={{ padding: '6px 12px', backgroundColor: '#fa5252', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>登出</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        
        {/* 第一區塊：新增 */}
        <div style={{ flex: '1 1 250px', padding: '20px', border: '1px solid #dee2e6', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#495057' }}>➕ 1. 新增成員</h3>
          <form onSubmit={handleAddPerson} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div><label style={{display:'inline-block', width:'80px'}}>姓名: </label><input style={{padding:'5px', width:'60%'}} value={name} onChange={e => setName(e.target.value)} required /></div>
            <div><label style={{display:'inline-block', width:'80px'}}>性別: </label>
              <select style={{padding:'5px', width:'60%'}} value={gender} onChange={e => setGender(e.target.value)}>
                <option value="男">男</option><option value="女">女</option><option value="未知">未知</option>
              </select></div>
            <div><label style={{display:'inline-block', width:'80px'}}>生日: </label><input type="date" style={{padding:'5px', width:'60%'}} value={birthday} onChange={e => setBirthday(e.target.value)} /></div>
            <div><label style={{display:'inline-block', width:'80px'}}>地點: </label><input style={{padding:'5px', width:'60%'}} value={location} onChange={e => setLocation(e.target.value)} /></div>
            <div><label style={{display:'inline-block', width:'80px'}}>年收入: </label><input type="number" style={{padding:'5px', width:'60%'}} value={income} onChange={e => setIncome(e.target.value)} /></div>
            <div><label style={{display:'inline-block', width:'80px'}}>身心疾病: </label>
              <select style={{padding:'5px', width:'60%'}} value={hasIllness} onChange={e => setHasIllness(e.target.value)}>
                <option value="無">無</option><option value="有">有</option>
              </select></div>
            <div><label style={{display:'inline-block', width:'80px'}}>是否在世: </label>
              <select style={{padding:'5px', width:'60%'}} value={isAlive} onChange={e => setIsAlive(e.target.value)}>
                <option value="是">是</option><option value="否">已故</option>
              </select></div>
            <button type="submit" disabled={isAdding} style={{ padding: '8px', backgroundColor: isAdding ? '#ced4da' : '#40c057', color: 'white', border: 'none', borderRadius: '4px', cursor: isAdding ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '10px' }}>{isAdding ? '連線中...' : '建立人物'}</button>
          </form>
        </div>

        {/* 第二區塊：建立關係 */}
        <div style={{ flex: '1 1 250px', padding: '20px', border: '1px solid #4dabf7', borderRadius: '12px', backgroundColor: '#e7f5ff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#1864ab' }}>🔗 2. 建立關係</h3>
          <form onSubmit={handleAddRelation} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><label style={{display:'inline-block', width:'60px'}}>人物 A: </label>
              <select style={{padding:'5px', width:'60%'}} value={person1} onChange={e => setPerson1(e.target.value)} required>
                <option value="">請選擇...</option>
                {familyData.nodes.map(p => <option key={`p1-${p.id}`} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div><label style={{display:'inline-block', width:'60px'}}>關係: </label>
              <select style={{padding:'5px', width:'60%'}} value={relation} onChange={e => setRelation(e.target.value)}>
                <option value="PARENT_OF">是他的父母</option><option value="MARRIED_TO">是他的配偶</option>
              </select>
            </div>
            <div><label style={{display:'inline-block', width:'60px'}}>人物 B: </label>
              <select style={{padding:'5px', width:'60%'}} value={person2} onChange={e => setPerson2(e.target.value)} required>
                <option value="">請選擇...</option>
                {familyData.nodes.map(p => <option key={`p2-${p.id}`} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <button type="submit" style={{ padding: '8px', backgroundColor: '#228be6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>牽紅線連起來！</button>
          </form>
        </div>

        {/* 第三區塊：刪除成員 */}
        <div style={{ flex: '1 1 250px', padding: '20px', border: '1px solid #ff8787', borderRadius: '12px', backgroundColor: '#fff5f5', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#c92a2a' }}>🗑️ 3. 刪除成員</h3>
          <form onSubmit={handleDeletePerson} style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
            <div><label style={{display:'inline-block', width:'60px'}}>人物: </label>
              <select style={{padding:'5px', width:'60%'}} value={deleteName} onChange={e => setDeleteName(e.target.value)} required>
                <option value="">請選擇要刪除的人...</option>
                {familyData.nodes.map(p => <option key={`del-${p.id}`} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <p style={{ fontSize: '12px', color: '#868e96', margin: '0' }}>注意：刪除人物會同時拔除他身上的所有連線。</p>
            <button type="submit" style={{ padding: '8px', backgroundColor: '#fa5252', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: 'auto' }}>永久刪除</button>
          </form>
        </div>

        {/* 第四區塊：修改成員 */}
        <div style={{ flex: '1 1 250px', padding: '20px', border: '1px solid #fcc419', borderRadius: '12px', backgroundColor: '#fff9db', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#e67700' }}>✏️ 4. 修改成員</h3>
          <form onSubmit={handleEditPerson} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div><label style={{display:'inline-block', width:'80px'}}>選擇人物: </label>
              <select style={{padding:'5px', width:'60%'}} value={editId} onChange={handleEditSelection} required>
                <option value="">請選擇要修改的人...</option>
                {familyData.nodes.map(p => <option key={`edit-${p.id}`} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {editId && (
              <>
                <div><label style={{display:'inline-block', width:'80px'}}>姓名: </label><input style={{padding:'5px', width:'60%'}} value={editName} onChange={e => setEditName(e.target.value)} required /></div>
                <div><label style={{display:'inline-block', width:'80px'}}>性別: </label>
                  <select style={{padding:'5px', width:'60%'}} value={editGender} onChange={e => setEditGender(e.target.value)}>
                    <option value="男">男</option><option value="女">女</option><option value="未知">未知</option>
                  </select></div>
                <div><label style={{display:'inline-block', width:'80px'}}>生日: </label><input type="date" style={{padding:'5px', width:'60%'}} value={editBirthday} onChange={e => setEditBirthday(e.target.value)} /></div>
                <div><label style={{display:'inline-block', width:'80px'}}>地點: </label><input style={{padding:'5px', width:'60%'}} value={editLocation} onChange={e => setEditLocation(e.target.value)} /></div>
                <div><label style={{display:'inline-block', width:'80px'}}>年收入: </label><input type="number" style={{padding:'5px', width:'60%'}} value={editIncome} onChange={e => setEditIncome(e.target.value)} /></div>
                <div><label style={{display:'inline-block', width:'80px'}}>身心疾病: </label>
                  <select style={{padding:'5px', width:'60%'}} value={editHasIllness} onChange={e => setEditHasIllness(e.target.value)}>
                    <option value="無">無</option><option value="有">有</option>
                  </select></div>
                <div><label style={{display:'inline-block', width:'80px'}}>是否在世: </label>
                  <select style={{padding:'5px', width:'60%'}} value={editIsAlive} onChange={e => setEditIsAlive(e.target.value)}>
                    <option value="是">是</option><option value="否">已故</option>
                  </select></div>
                <button type="submit" disabled={isEditing} style={{ padding: '8px', backgroundColor: isEditing ? '#ced4da' : '#fab005', color: 'white', border: 'none', borderRadius: '4px', cursor: isEditing ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '10px' }}>{isEditing ? '更新中...' : '儲存修改'}</button>
              </>
            )}
          </form>
        </div>

      </div>

      {/* 畫布區塊 */}
      <div style={{ border: '2px solid #ced4da', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
        {(!familyData || !familyData.nodes || familyData.nodes.length === 0) 
            ? <p style={{textAlign: 'center', padding: '50px'}}>目前資料庫空空如也，趕快新增人物吧！</p> 
            : <svg ref={svgRef}></svg>
        }
      </div>
    </div>
  );
}

export default App;
