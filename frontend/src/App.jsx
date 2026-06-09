import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import jsPDF from 'jspdf';
import './App.css';

function App() {
  // ==========================================
  // 🔐 第一區塊：會員登入系統 State (保留你的多帳號邏輯)
  // ==========================================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(''); 
  const [authMode, setAuthMode] = useState('login');  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // ==========================================
  // 🌳 第二區塊：家族樹系統 State
  // ==========================================
  const [familyData, setFamilyData] = useState({ nodes: [], links: [] });
  
  const [name, setName] = useState('');
  const [gender, setGender] = useState('男');
  const [birthday, setBirthday] = useState(''); 
  const [location, setLocation] = useState('');
  const [income, setIncome] = useState('');
  const [hasIllness, setHasIllness] = useState('無'); 
  const [isAlive, setIsAlive] = useState('是');       
  const [photo, setPhoto] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false); 

  const [person1, setPerson1] = useState('');
  const [person2, setPerson2] = useState('');
  const [relation, setRelation] = useState('PARENT_OF');

  const [deleteName, setDeleteName] = useState('');

  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState('男');
  const [editBirthday, setEditBirthday] = useState(''); 
  const [editLocation, setEditLocation] = useState('');
  const [editIncome, setEditIncome] = useState('');
  const [editHasIllness, setEditHasIllness] = useState('無');
  const [editIsAlive, setEditIsAlive] = useState('是');
  const [editPhoto, setEditPhoto] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const svgRef = useRef();
  const getSvgDataUrl = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return null;

    const clonedSvg = svgElement.cloneNode(true);

    const style = document.createElement('style');
    style.textContent = `
      .graph-link {
        fill: none;
        stroke-width: 2.5;
        opacity: 0.9;
      }

      .graph-link.parent {
        stroke: #74c0fc;
      }

      .graph-link.married {
        stroke: #ff922b;
        stroke-dasharray: 8 6;
      }

      .person-shape.male {
        fill: #74c0fc;
        stroke: #ffffff;
        stroke-width: 3;
        filter: url(#nodeShadow);
      }

      .person-shape.female {
        fill: #ffc9c9;
        stroke: #ffffff;
        stroke-width: 3;
        filter: url(#nodeShadow);
      }

      .person-shape.unknown {
        fill: #e9ecef;
        stroke: #ffffff;
        stroke-width: 3;
        filter: url(#nodeShadow);
      }

      .node-label {
        fill: #343a40;
        font-size: 15px;
        font-weight: 700;
        font-family: Arial, sans-serif;
        pointer-events: none;
      }
    `;

    clonedSvg.insertBefore(style, clonedSvg.firstChild);
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);

    const svgBlob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8'
    });

    return URL.createObjectURL(svgBlob);
  };
  const exportAsPNG = () => {
    const svgElement = svgRef.current;

    if (!svgElement || totalMembers === 0) {
      alert('目前沒有家族樹可以匯出！');
      return;
    }

    const url = getSvgDataUrl();
    if (!url) return;

    const img = new Image();

    img.onload = () => {
      const width = svgElement.viewBox.baseVal.width || 980;
      const height = svgElement.viewBox.baseVal.height || 580;

      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${currentUser}_family_tree.png`;
      link.click();
    };

    img.src = url;
  };

  const exportAsPDF = () => {
    const svgElement = svgRef.current;

    if (!svgElement || totalMembers === 0) {
      alert('目前沒有家族樹可以匯出！');
      return;
    }

    const url = getSvgDataUrl();
    if (!url) return;

    const img = new Image();

    img.onload = () => {
      const width = svgElement.viewBox.baseVal.width || 980;
      const height = svgElement.viewBox.baseVal.height || 580;

      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [width, height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${currentUser}_family_tree.pdf`);
    };

    img.src = url;
  };

  const exportMembersTable = () => {
    if (!familyData.nodes || familyData.nodes.length === 0) {
      alert('目前沒有成員資料可以匯出！');
      return;
    }

    const headers = ['姓名', '性別', '生日', '出生年份', '地點', '年收入', '身心疾病', '是否在世'];

    const rows = familyData.nodes.map(member => [
      member.name ?? '',
      member.gender ?? '',
      member.birthday ?? '',
      member.birthYear ?? '',
      member.location ?? '',
      member.income ?? '',
      member.hasIllness ?? '',
      member.isAlive ?? ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentUser}_family_members.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 取得數據用於畫面顯示
  const totalMembers = familyData.nodes?.length || 0;
  const totalRelations = familyData.links?.length || 0;

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
            fetchData(result.username); 
        } else {
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

  const handleLogout = () => {
      setIsLoggedIn(false);
      setCurrentUser('');
      setUsername('');
      setPassword('');
      setFamilyData({ nodes: [], links: [] }); 
  };

  // ==========================================
  // 🌳 家族樹系統 API 處理 (保留傳遞 username 的邏輯)
  // ==========================================
  const fetchData = async (user = currentUser) => {
    try {
      const res = await fetch(
        `http://localhost/family_tree/getFamily.php?username=${encodeURIComponent(user)}`,
        { cache: 'no-store' }
      );
      const result = await res.json();
      if (result.status === 'success') setFamilyData(result.data);
    } catch (error) { console.error('抓取資料失敗', error); }
  };

  const handlePhotoChange = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddPerson = async (e) => {
    e.preventDefault();
    setIsAdding(true); 
    try {
      const res = await fetch('http://localhost/family_tree/addRelative.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          name,
          gender,
          birthday,
          location,
          income,
          hasIllness,
          isAlive,
          photo,
          phone,
          email
        })
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert('🎉 ' + result.message);
        setName(''); setGender('男'); setBirthday(''); setLocation('');
        setIncome(''); setHasIllness('無'); setIsAlive('是'); setPhoto('');setPhone(''); setEmail('');
        fetchData(currentUser); 
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
        body: JSON.stringify({ username: currentUser, person1, person2, relation })
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert('🔗 ' + result.message);
        setPerson1(''); setPerson2(''); fetchData(currentUser); 
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
        body: JSON.stringify({ username: currentUser, name: deleteName })
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert('🗑️ ' + result.message);
        setDeleteName(''); fetchData(currentUser); 
      } else { alert('❌ 刪除失敗: ' + result.message); }
    } catch (error) { console.error('刪除失敗', error); }
  };
  const deletePersonByNode = async (personName) => {
  if (!personName) return;

  if (!window.confirm(`確定要刪除「${personName}」嗎？這會同時刪除他所有的關係連線喔！`)) {
    return;
  }

  try {
    const res = await fetch('http://localhost/family_tree/deleteRelative.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser,
        name: personName
      })
    });

    const result = await res.json();

    if (result.status === 'success') {
      alert('✅ ' + result.message);
      setDeleteName('');
      fetchData(currentUser);
    } else {
      alert('❌ 刪除失敗: ' + result.message);
    }
  } catch (error) {
    console.error('刪除失敗', error);
    alert('系統發生錯誤，請確認 XAMPP / Apache 有啟動。');
  }
};

  const handleEditSelection = (e) => {
    const selectedId = e.target.value;
    setEditId(selectedId);
    if (!selectedId) {
      setEditName('');
      setEditGender('男');
      setEditBirthday('');
      setEditLocation('');
      setEditIncome('');
      setEditHasIllness('無');
      setEditIsAlive('是');
      setEditPhoto('');
      setEditPhone('');
      setEditEmail('');
      return;
    }
    const targetNode = familyData.nodes.find(n => String(n.id) === String(selectedId));
    if (targetNode) {
        setEditName(targetNode.name || ''); setEditGender(targetNode.gender || '未知');
        setEditBirthday(targetNode.birthday === '未知' ? '' : targetNode.birthday || '');
        setEditLocation(targetNode.location === '未知' ? '' : targetNode.location || '');
        setEditIncome(targetNode.income === '未知' ? '' : targetNode.income || '');
        setEditHasIllness(targetNode.hasIllness || '無'); setEditIsAlive(targetNode.isAlive || '是');
        setEditPhoto(targetNode.photo || '');
        setEditPhone(targetNode.phone === '未知' ? '' : targetNode.phone || '');
        setEditEmail(targetNode.email === '未知' ? '' : targetNode.email || '');
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
        body: JSON.stringify({
          username: currentUser,
          id: editId,
          name: editName,
          gender: editGender,
          birthday: editBirthday,
          location: editLocation,
          income: editIncome,
          hasIllness: editHasIllness,
          isAlive: editIsAlive,
          photo: editPhoto,
          phone: editPhone,
          email: editEmail
        })
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert('✨ ' + result.message);
        setEditId(''); setEditName(''); setEditGender('男'); setEditBirthday(''); 
        setEditLocation(''); setEditIncome(''); setEditHasIllness('無'); setEditIsAlive('是'); setEditPhoto('');
        fetchData(currentUser); 
      } else { alert('❌ 修改失敗: ' + result.message); }
    } catch (error) { alert('系統發生錯誤！'); } finally { setIsEditing(false); }
  };

  // ==========================================
  // 🎨 D3.js 畫圖邏輯 (你的防彈演算法 + 同學的 CSS 樣式)
  // ==========================================
  useEffect(() => {
    if (!isLoggedIn || !familyData || !familyData.nodes || familyData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    d3.select("body").selectAll(".d3-tooltip").remove(); 
    
    // 套用同學的 .d3-tooltip 樣式類別
    const tooltip = d3.select("body").append("div")
      .attr("class", "d3-tooltip")
      .style("visibility", "hidden")
      .style("width", "560px")
      .style("max-width", "560px")
      .style("box-sizing", "border-box")
      .style("white-space", "normal")
      .style("overflow", "hidden");
      
    const width = 980; const height = 580;
    svg.attr('width', '100%').attr('height', height).attr('viewBox', [0, 0, width, height]);

    // 嚴格保留你原本的 Object.create 避免破壞原型鏈
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
            } else if (type === 'MARRIED_TO' || type === 'DIVORCED' || type === 'COHABITATION' || type === 'SEPARATED') {
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
                d.fy = 90 + ratio * (height - 180); 
            }
        } else {
            const year = parseInt(d.birthYear || (d.birthday ? String(d.birthday).substring(0, 4) : 0));
            if (!isNaN(year) && year > 0 && maxYear > minYear) {
                const ratio = (year - minYear) / (maxYear - minYear);
                d.fy = 90 + ratio * (height - 180); 
            } else {
                d.fy = height / 2; 
            }
        }
    });

    // 調整物理引擎參數以適應新版型
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(140))
        .force("charge", d3.forceManyBody().strength(-900))
        .force("collision", d3.forceCollide().radius(46))
        .force("x", d3.forceX(width / 2).strength(0.05));

    // 加入同學的高級陰影特效
    svg.append('defs').append('filter').attr('id', 'nodeShadow').append('feDropShadow').attr('dx', 0).attr('dy', 8).attr('stdDeviation', 8).attr('flood-opacity', 0.16);

    const link = svg.append("g").attr("class", "graph-links")
        .selectAll("path").data(links).join("path")
        .attr("class", d => {
            const type = d.type || d.label || d.relation || 'PARENT_OF';

            if (type === 'MARRIED_TO') return 'graph-link married';
            if (type === 'COHABITATION') return 'graph-link cohabitation';
            if (type === 'SEPARATED') return 'graph-link separated';
            if (type === 'DIVORCED') return 'graph-link divorced';

            return 'graph-link parent';
        });

    const drag = d3.drag()
        .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; 
        })
        .on("drag", (event, d) => { d.fx = Math.max(48, Math.min(width - 48, event.x)); })
        .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); });

    function getSymbolType(d) {
      const disabled =
        d.hasIllness === '有' ||
        d.hasIllness === '是' ||
        d.hasIllness === true;

      const dead =
        d.isAlive === '否';

      const triangle =
        d.gender === '懷孕' ||
        d.gender === '未知' ||
        d.gender === '不清楚性別';

      if (triangle && disabled) return 'disabledTriangle';

      if (triangle) return 'triangle';

      if (dead) {
        return d.gender === '女'
          ? 'deadFemale'
          : 'deadMale';
      }

      if (disabled) {
        return d.gender === '女'
          ? 'disabledFemale'
          : 'disabledMale';
      }

      return d.gender === '女'
        ? 'female'
        : 'male';
    }

    const node = svg.append("g").attr("class", "graph-nodes").selectAll("g").data(nodes).join("g")
      .attr("class", "graph-node").call(drag)
      .on("mouseover", (event, d) => {
        tooltip.html(`
          <div style="
            display:flex;
            gap:20px;
            align-items:flex-start;
            width:520px;
            max-width:520px;
            overflow:hidden;
          ">
            <div style="
              width:300px;
              max-width:300px;
              min-width:0;
              overflow:hidden;
              overflow-wrap:anywhere;
              word-break:break-all;
              line-height:1.6;
            ">
              <div class="tooltip-title">👤 ${d.name}</div>
              <div><strong>性別：</strong>${d.gender || '未知'}</div>
              <div><strong>生日：</strong>${d.birthday || '未知'}</div>
              <div><strong>電話：</strong>${d.phone || '未知'}</div>
              <div><strong>信箱：</strong>${d.email || '未知'}</div>
              <div><strong>地點：</strong>${d.location || '未知'}</div>
              <div><strong>收入：</strong>${d.income ? `$${Number(d.income).toLocaleString()}` : '未知'}</div>
              <div><strong>身心疾病：</strong>${d.hasIllness || '無'}</div>
              <div><strong>狀態：</strong>${d.isAlive || '是'}</div>
            </div>

            ${
              d.photo
                ? `<div style="
                    width:160px;
                    height:160px;
                    flex:0 0 160px;
                    overflow:hidden;
                    border-radius:18px;
                    border:3px solid #e9ecef;
                    box-shadow:0 4px 12px rgba(0,0,0,0.15);
                    background:#f8f9fa;
                  ">
                    <img src="${d.photo}" style="
                      width:100%;
                      height:100%;
                      object-fit:cover;
                      display:block;
                    " />
                  </div>`
                : `<div style="width:160px;height:160px;flex:0 0 160px;border-radius:18px;background:#f1f3f5;display:flex;align-items:center;justify-content:center;color:#868e96;font-size:12px;">無照片</div>`
            }
          </div>
        `);
        tooltip.style("visibility", "visible");
      })
      .on("mousemove", (event) => {
        const tooltipNode = tooltip.node();
        const tooltipWidth = tooltipNode.offsetWidth;
        const tooltipHeight = tooltipNode.offsetHeight;

        let left = event.pageX + 16;
        let top = event.pageY + 16;

        if (left + tooltipWidth > window.innerWidth) {
          left = event.pageX - tooltipWidth - 16;
        }

        if (top + tooltipHeight > window.innerHeight) {
          top = event.pageY - tooltipHeight - 16;
        }

        tooltip
          .style("left", `${left}px`)
          .style("top", `${top}px`);
      })
      .on("mouseout", () => { tooltip.style("visibility", "hidden"); });
      
    // 套用同學的美編節點形狀
    node.each(function(d) {
      const group = d3.select(this);
      const type = getSymbolType(d);

      const size = 60;
      const r = 30;

      // 男性
      if (
        type === 'male' ||
        type === 'deadMale' ||
        type === 'disabledMale'
      ) {
        group.append("rect")
          .attr("x", -r)
          .attr("y", -r)
          .attr("width", size)
          .attr("height", size)
          .attr("fill", "white")
          .attr("stroke", "#333")
          .attr("stroke-width", 2);
      }

      // 女性
      if (
        type === 'female' ||
        type === 'deadFemale' ||
        type === 'disabledFemale'
      ) {
        group.append("circle")
          .attr("r", r)
          .attr("fill", "white")
          .attr("stroke", "#333")
          .attr("stroke-width", 2);
      }

      // 懷孕 / 不明性別
      if (
        type === 'triangle' ||
        type === 'disabledTriangle'
      ) {

        group.append("path")
          .attr(
            "d",
            `M 0 -30 L 26 20 L -26 20 Z`
          )
          .attr("fill", "white")
          .attr("stroke", "#333")
          .attr("stroke-width", 2);
      }

      // 身障男性
      if (type === 'disabledMale') {

        group.append("rect")
          .attr("x", 0)
          .attr("y", -r)
          .attr("width", r)
          .attr("height", size)
          .attr("fill", "black");
      }

      // 身障女性
      if (type === 'disabledFemale') {

        group.append("path")
          .attr(
            "d",
            d3.arc()({
              innerRadius: 0,
              outerRadius: r,
              startAngle: 0,
              endAngle: Math.PI
            })
          )
          .attr("fill", "black");
      }

      // 身障三角形
      if (type === 'disabledTriangle') {

        group.append("path")
          .attr(
            "d",
            `M 0 -30 L 26 20 L 0 20 Z`
          )
          .attr("fill", "black");
      }

      // 死亡
      if (
        type === 'deadMale' ||
        type === 'deadFemale'
      ) {

        group.append("line")
          .attr("x1", -r)
          .attr("y1", -r)
          .attr("x2", r)
          .attr("y2", r)
          .attr("stroke", "black")
          .attr("stroke-width", 3);

        group.append("line")
          .attr("x1", r)
          .attr("y1", -r)
          .attr("x2", -r)
          .attr("y2", r)
          .attr("stroke", "black")
          .attr("stroke-width", 3);
      }
    });
    ////////////////////////////////////////////////////////////////////////////
    const deleteButton = node
      .append("g")
      .attr("class", "delete-node-button")
      .attr("transform", "translate(28, -28)")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();

        if (event.defaultPrevented) return;

        deletePersonByNode(d.name);
      })
      .on("mouseover", function(event) {
        event.stopPropagation();
        d3.select(this).select("circle").attr("fill", "#c92a2a");
      })
      .on("mouseout", function() {
        d3.select(this).select("circle").attr("fill", "#fa5252");
      });

    deleteButton
      .append("circle")
      .attr("r", 11)
      .attr("fill", "#fa5252")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2);

    deleteButton
      .append("text")
      .text("×")
      .attr("text-anchor", "middle")
      .attr("dy", "0.34em")
      .attr("fill", "#ffffff")
      .attr("font-size", 17)
      .attr("font-weight", 900)
      .style("pointer-events", "none");
  ///////////////////////////////////////////////////////////////////////
    node.append("text")
    .text(d => d.name)
    .attr("text-anchor", "middle")
    .attr("y", 55)
    .attr("class", "node-label")
    .attr("font-size", 14)
    .attr("font-weight", "bold")
    .attr("fill", "#333");

    simulation.on("tick", () => {
      svg.selectAll(".relationship-marker").remove();

      link.attr("d", d => {
        if (d.source.x === undefined || d.target.x === undefined) return "";

        const type = d.type || d.label || d.relation || 'PARENT_OF';

        const isMarriageLine =
          type === 'MARRIED_TO' ||
          type === 'DIVORCED';

        const isCohabitLine =
          type === 'COHABITATION' ||
          type === 'SEPARATED';

        // 婚姻線、同居線可以共存，所以上下錯開
        if (isMarriageLine || isCohabitLine) {
          const offsetY = isMarriageLine ? -8 : 8;

          return `
            M${d.source.x},${d.source.y + offsetY}
            L${d.target.x},${d.target.y + offsetY}
          `;
        }

        // 父母子女線：依照上下方向接線，避免人物頭上凸點
        const sourceIsAbove = d.source.y < d.target.y;

        const sourceY = sourceIsAbove
          ? d.source.y + 70
          : d.source.y - 35;

        const targetY = sourceIsAbove
          ? d.target.y - 35
          : d.target.y + 70;

        const midY = (sourceY + targetY) / 2;

        return `
          M${d.source.x},${sourceY}
          L${d.source.x},${midY}
          L${d.target.x},${midY}
          L${d.target.x},${targetY}
        `;
      });

      links.forEach(d => {

        const type = d.type || d.label || d.relation;

        if (
            type !== 'SEPARATED' &&
            type !== 'DIVORCED'
        ) return;

        const isMarriageLine =
          type === 'MARRIED_TO' ||
          type === 'DIVORCED';

        const isCohabitLine =
          type === 'COHABITATION' ||
          type === 'SEPARATED';

        const offsetY = isMarriageLine ? -8 : 8;

        const midX = (d.source.x + d.target.x) / 2;
        const midY = ((d.source.y + offsetY) + (d.target.y + offsetY)) / 2;

        const marker = svg.append("g")
            .attr("class", "relationship-marker");

        // 分居：一條斜線
        if (type === 'SEPARATED') {
          marker.append("line")
            .attr("x1", midX - 5)
            .attr("y1", midY - 8)
            .attr("x2", midX + 5)
            .attr("y2", midY + 8)
            .attr("stroke", "#333")
            .attr("stroke-width", 2);
        }

        // 離婚：兩條斜線
        if (type === 'DIVORCED') {
          marker.append("line")
            .attr("x1", midX - 6)
            .attr("y1", midY - 8)
            .attr("x2", midX + 6)
            .attr("y2", midY + 8)
            .attr("stroke", "#333")
            .attr("stroke-width", 2);

          marker.append("line")
            .attr("x1", midX + 6)
            .attr("y1", midY - 8)
            .attr("x2", midX - 6)
            .attr("y2", midY + 8)
            .attr("stroke", "#333")
            .attr("stroke-width", 2);
        }

});

      node.attr("transform", d => `translate(${d.x}, ${d.y})`);
    });
  }, [familyData, isLoggedIn]);
  
  // ==========================================
  // 🚪 畫面渲染邏輯 (未登入 vs 已登入)
  // ==========================================

  if (!isLoggedIn) {
    return (
      <main className="app-shell" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 0 }}>
        <article className="panel-card" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-h)' }}>
            🌳 {authMode === 'login' ? '會員登入' : '註冊新帳號'}
          </h2>
          <form className="form-grid" onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ width: '100%' }}>帳號：
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </label>
            <label style={{ width: '100%' }}>密碼：
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <button className="submit-button green" type="submit" disabled={isAuthLoading} style={{ marginTop: '8px' }}>
              {isAuthLoading ? '處理中...' : (authMode === 'login' ? '登入系統' : '註冊帳號')}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '14px' }}>
              {authMode === 'login' ? '還沒有帳號嗎？ ' : '已經有帳號了？ '}
            </span>
            <button 
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setPassword(''); }} 
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}>
              {authMode === 'login' ? '點我註冊' : '點我登入'}
            </button>
          </div>
        </article>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Family Tree Dashboard</p>
          <h1>互動式家族樹系統</h1>
          <p className="hero-description">
            用更清楚的視覺化方式管理成員、建立關係，並在同一個畫面查看專屬於你的家族網絡。
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#add-member">新增成員</a>
            <a className="secondary-action" href="#family-map">查看家族圖</a>
          </div>
        </div>

        <div className="hero-panel" aria-label="資料摘要">
          <div className="stat-card">
            <span>{totalMembers}</span>
            <p>成員數</p>
          </div>
          <div className="stat-card">
            <span>{totalRelations}</span>
            <p>關係連線</p>
          </div>
          <div className="mini-tree" aria-hidden="true">
            <div className="mini-node root">你</div>
            <div className="mini-line" />
            <div className="mini-row">
              <div className="mini-node">父母</div>
              <div className="mini-node accent">配偶</div>
              <div className="mini-node">子女</div>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 Toolbar 融入登出功能與使用者名稱 */}
      <section className="toolbar">
        <div>
          <strong>目前資料庫狀態</strong>
          <span>{totalMembers === 0 ? '尚未建立成員' : `已建立 ${totalMembers} 位成員`}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--text-h)', fontWeight: 'bold' }}>歡迎，{currentUser} 👋</span>
          <button className="ghost-button" type="button" onClick={handleLogout} style={{ minHeight: '36px', padding: '0 16px', color: '#d94848' }}>登出</button>
          <button className="primary-action" type="button" onClick={() => fetchData(currentUser)} style={{ minHeight: '36px', padding: '0 16px' }}>重新整理</button>
        </div>
      </section>

      <section className="control-grid" aria-label="家族樹操作區">
        <article id="add-member" className="panel-card accent-green">
          <div className="card-heading">
            <span className="card-icon">＋</span>
            <div><p className="card-kicker">Step 1</p><h2>新增成員</h2></div>
          </div>
          <form className="form-grid" onSubmit={handleAddPerson}>
            <label>姓名<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
            <label>性別／是否懷孕<select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="懷孕">懷孕</option>
              <option value="不清楚性別">不清楚性別</option></select></label>
            <label>生日<input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} /></label>
            <label>電話<input type="tel" placeholder="例如：0912345678" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            <label>Email<input type="email" placeholder="例如：example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label>地點<input placeholder="例如：台北市" value={location} onChange={(e) => setLocation(e.target.value)} /></label>
            <label>年收入<input type="number" placeholder="例如：800000" value={income} onChange={(e) => setIncome(e.target.value)} /></label>
            <label>身心疾病<select value={hasIllness} onChange={(e) => setHasIllness(e.target.value)}><option value="無">無</option><option value="有">有</option></select></label>
            <label>是否在世<select value={isAlive} onChange={(e) => setIsAlive(e.target.value)}><option value="是">是</option><option value="否">已故</option></select></label>
            <label>
              大頭貼
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e, setPhoto)}
              />
            </label>
            <button className="submit-button green" type="submit" disabled={isAdding}>{isAdding ? '建立中...' : '建立人物'}</button>
          </form>
        </article>

        <article className="panel-card accent-blue">
          <div className="card-heading">
            <span className="card-icon">↔</span>
            <div><p className="card-kicker">Step 2</p><h2>建立關係</h2></div>
          </div>
          <form className="form-grid" onSubmit={handleAddRelation}>
            <label>人物 A<select value={person1} onChange={(e) => setPerson1(e.target.value)} required><option value="">請選擇...</option>{familyData.nodes.map((p) => <option key={`p1-${p.id}`} value={p.name}>{p.name}</option>)}</select></label>
            <label>關係<select value={relation} onChange={(e) => setRelation(e.target.value)}><option value="PARENT_OF">父母子女</option>
              <option value="MARRIED_TO">已婚</option>
              <option value="COHABITATION">同居</option>
              <option value="SEPARATED">分居</option>
              <option value="DIVORCED">離婚</option></select></label>
            <label>人物 B<select value={person2} onChange={(e) => setPerson2(e.target.value)} required><option value="">請選擇...</option>{familyData.nodes.map((p) => <option key={`p2-${p.id}`} value={p.name}>{p.name}</option>)}</select></label>
            <button className="submit-button blue" type="submit">建立連線</button>
          </form>
        </article>

        <article className="panel-card accent-yellow">
          <div className="card-heading">
            <span className="card-icon">✎</span>
            <div><p className="card-kicker">Step 3</p><h2>修改成員</h2></div>
          </div>
          <form className="form-grid" onSubmit={handleEditPerson}>
            <label className="full-field">選擇人物<select value={editId} onChange={handleEditSelection} required><option value="">請選擇要修改的人...</option>{familyData.nodes.map((p) => <option key={`edit-${p.id}`} value={p.id}>{p.name}</option>)}</select></label>
            {editId && (
              <>
                <label>姓名<input value={editName} onChange={(e) => setEditName(e.target.value)} required /></label>
                <label>性別<select value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                  <option value="男">男</option>
                  <option value="女">女</option>
                  <option value="懷孕">懷孕</option>
                  <option value="不清楚性別">不清楚性別</option></select></label>
                <label>生日<input type="date" value={editBirthday} onChange={(e) => setEditBirthday(e.target.value)} /></label>
                <label>電話<input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></label>
                <label>Email<input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} /></label>
                <label>地點<input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} /></label>
                <label>年收入<input type="number" value={editIncome} onChange={(e) => setEditIncome(e.target.value)} /></label>
                <label>身心疾病<select value={editHasIllness} onChange={(e) => setEditHasIllness(e.target.value)}><option value="無">無</option><option value="有">有</option></select></label>
                <label>是否在世<select value={editIsAlive} onChange={(e) => setEditIsAlive(e.target.value)}><option value="是">是</option><option value="否">已故</option></select></label>
                <label>
                  大頭貼
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(e, setEditPhoto)}
                  />
                </label>
                <button className="submit-button yellow" type="submit" disabled={isEditing}>{isEditing ? '更新中...' : '儲存修改'}</button>
              </>
            )}
          </form>
        </article>

        <article className="panel-card accent-red">
          <div className="card-heading">
            <span className="card-icon">−</span>
            <div><p className="card-kicker">Step 4</p><h2>刪除成員</h2></div>
          </div>
          <form className="form-grid" onSubmit={handleDeletePerson}>
            <label className="full-field">人物<select value={deleteName} onChange={(e) => setDeleteName(e.target.value)} required><option value="">請選擇要刪除的人...</option>{familyData.nodes.map((p) => <option key={`del-${p.id}`} value={p.name}>{p.name}</option>)}</select></label>
            <p className="warning-text">刪除人物會同時移除他的所有關係連線，請確認後再操作。</p>
            <button className="submit-button red" type="submit">永久刪除</button>
          </form>
        </article>
      </section>

      <section id="family-map" className="graph-section">
        <div className="section-heading">
          <div><p className="card-kicker">Visualization</p><h2>家族關係圖</h2></div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="submit-button green" type="button" onClick={exportAsPNG}>
              匯出 PNG
            </button>

            <button className="submit-button green" type="button" onClick={exportAsPDF}>
              匯出 PDF
            </button>

            <button className="submit-button green" type="button" onClick={exportMembersTable}>
              匯出成員表格
            </button>
          </div>

          <div className="legend">
            <span><i className="legend-square" /> 男性</span>
            <span><i className="legend-circle" /> 女性</span>
            <span><i className="legend-line" /> 關係</span>
          </div>
        </div>

        <div className="graph-canvas">
          {totalMembers === 0 ? (
            <div className="empty-state">
              <div>🌱</div><h3>目前資料庫空空如也</h3><p>先新增一位家族成員，就可以開始建立你的家族圖。</p>
            </div>
          ) : ( <svg ref={svgRef} /> )}
        </div>
      </section>
    </main>
  );
}

export default App;
