/* ================================================================
   OKINA Kanban — JS natif, zéro framework
   ================================================================ */

(function () {
  "use strict";

  var root = document.getElementById("root");
  var state = {
    route: "auth",          // auth | boards | board
    boardId: null,
    boards: seedBoards(),
    theme: "light",
    notifs: [
      { id:"n1", from:"u2", at:"2026-02-14T16:05:00", taskId:"t3", taskTitle:"Bug : déconnexion silencieuse après 15min", kind:"commentaire", unread:true },
      { id:"n2", from:"u4", at:"2026-02-12T09:30:00", taskId:"t3", taskTitle:"Bug : déconnexion silencieuse après 15min", kind:"commentaire", unread:true },
    ],
    showNotifs: false,
    openTaskId: null,
    addingInCol: null,     // column id where new-card form is open
    authMode: "login",     // login | signup
  };

  /* ---- helpers ---- */
  function getBoard() { return state.boards.find(function(b){ return b.id === state.boardId; }); }
  function getTask(id) { var b = getBoard(); return b ? b.tasks.find(function(t){ return t.id === id; }) : null; }
  function unreadCount() { return state.notifs.filter(function(n){ return n.unread; }).length; }

  function updateBoard(board) {
    state.boards = state.boards.map(function(b){ return b.id === board.id ? board : b; });
  }
  function updateTask(task) {
    var b = getBoard();
    b.tasks = b.tasks.map(function(t){ return t.id === task.id ? task : t; });
    updateBoard(b);
  }

  /* ---- render dispatcher ---- */
  function render() {
    document.documentElement.dataset.theme = state.theme;
    if (state.route === "auth") renderAuth();
    else if (state.route === "boards") renderBoards();
    else if (state.route === "board") renderBoardView();
    renderThemeToggle();
  }

  /* ================================================================
     AUTH
     ================================================================ */
  function renderAuth() {
    var m = state.authMode;
    var previewCols = ["À faire","En cours","Terminé"];
    var dotColors = [["#e0394a","#6b7280"],["#3b6ef5","#b45ee0"],["#1f9c70","#1f9c70"]];
    var previewHtml = '<div class="preview-card" aria-hidden="true">' +
      previewCols.map(function(t,i){
        return '<div class="preview-col"><div class="col-h">'+esc(t)+'</div>' +
          '<div class="preview-card-mini"><span class="dot" style="background:'+dotColors[i][0]+'"></span><span>Tâche '+(i+1)+'</span></div>' +
          '<div class="preview-card-mini"><span class="dot" style="background:'+dotColors[i][1]+'"></span><span>Item suivi</span></div></div>';
      }).join("") + '</div>';

    root.innerHTML =
      '<div class="auth-shell">' +
        '<aside class="auth-aside">' +
          '<div class="auth-brand"><div class="mark">'+Icon.Shield+'</div><span>OKINA Kanban</span></div>' +
          '<div><h1>Vos projets, vos données, votre infrastructure.</h1>' +
          '<p>Une alternative souveraine aux outils de gestion de projet hébergés à l\'étranger. Pensée pour les équipes OKINA.</p></div>' +
          previewHtml +
        '</aside>' +
        '<div class="auth-form-wrap"><form class="auth-form" id="authForm">' +
          '<h2 class="form-title">'+(m==="login"?"Connexion":"Créer un compte")+'</h2>' +
          '<p class="form-sub">'+(m==="login"?"Heureux de vous revoir.":"Rejoignez votre équipe sur OKINA Kanban.")+'</p>' +
          '<div class="field"><label>Pseudo</label><input type="text" id="authPseudo" placeholder="audrey" autofocus /><span class="err" id="errPseudo"></span>' +
            (m==="signup"?'<span class="hint">Sera unique sur la plateforme.</span>':'') + '</div>' +
          (m==="signup"?'<div class="field"><label>Email</label><input type="email" id="authEmail" placeholder="audrey.mercier@okina.fr" /><span class="err" id="errEmail"></span></div>':'') +
          '<div class="field"><label>Mot de passe</label><input type="password" id="authPass" placeholder="••••••••" /><span class="err" id="errPass"></span>' +
            (m==="signup"?'<span class="hint">Minimum 8 caractères.</span>':'') + '</div>' +
          '<button type="submit" class="btn btn-primary btn-block" style="margin-top:8px">'+(m==="login"?"Se connecter":"Créer le compte")+'</button>' +
          '<p class="switch">'+(m==="login"
            ? 'Pas encore de compte ? <a id="switchAuth">S\'inscrire</a>'
            : 'Déjà inscrit·e ? <a id="switchAuth">Se connecter</a>') + '</p>' +
        '</form></div>' +
      '</div>';

    document.getElementById("authForm").onsubmit = function(e) {
      e.preventDefault();
      var pseudo = document.getElementById("authPseudo").value.trim();
      var pass = document.getElementById("authPass").value;
      var errP = document.getElementById("errPseudo");
      var errPw = document.getElementById("errPass");
      errP.textContent = ""; errPw.textContent = "";
      var emailEl = document.getElementById("authEmail");
      var errE = document.getElementById("errEmail");
      if (errE) errE.textContent = "";
      var ok = true;
      if (!pseudo) { errP.textContent = "Pseudo requis"; ok = false; }
      if (m === "signup") {
        if (emailEl && !emailEl.value.includes("@")) { errE.textContent = "Email invalide"; ok = false; }
        if (pass.length < 8) { errPw.textContent = "Au moins 8 caractères"; ok = false; }
      } else {
        if (!pass) { errPw.textContent = "Mot de passe requis"; ok = false; }
      }
      if (ok) { state.route = "boards"; render(); }
    };
    var sw = document.getElementById("switchAuth");
    if (sw) sw.onclick = function() { state.authMode = m === "login" ? "signup" : "login"; render(); };
  }

  /* ================================================================
     HEADER (shared)
     ================================================================ */
  function headerHtml(opts) {
    var uc = unreadCount();
    var brandClick = opts.brandAction || "";
    var crumb = opts.crumb || "";
    return '<header class="app-header">' +
      '<div class="brand" data-action="'+brandClick+'"><div class="mark">'+Icon.Shield+'</div><span>OKINA Kanban</span></div>' +
      crumb +
      '<div class="spacer"></div>' +
      '<button class="icon-btn" data-action="toggleNotifs" title="Notifications">'+Icon.Bell+(uc>0?'<span class="dot"></span>':'')+'</button>' +
      '<button class="user-chip">'+avatarHtml(ME.name)+'<span style="font-size:13px;font-weight:500">'+esc(ME.pseudo)+'</span></button>' +
      '<button class="btn btn-ghost btn-sm" data-action="logout">'+Icon.Logout+' '+(opts.logoutLabel||"Se déconnecter")+'</button>' +
    '</header>';
  }

  /* ================================================================
     BOARDS LIST
     ================================================================ */
  function renderBoards() {
    var cards = state.boards.map(function(b) {
      var membersHtml = b.members.slice(0,4).map(function(mid) {
        var u = userById(mid);
        return avatarHtml(u.name, "sm");
      }).join("");
      return '<div class="board-card" data-action="openBoard" data-id="'+b.id+'">' +
        '<div class="stripe"></div><h3>'+esc(b.name)+'</h3>' +
        '<div class="meta"><span>'+b.tasks.length+' tâche'+(b.tasks.length!==1?'s':'')+'</span>' +
        '<div class="members">'+membersHtml+'</div></div></div>';
    }).join("");

    root.innerHTML =
      '<div class="app-shell">' +
        headerHtml({ brandAction:"goBoards" }) +
        '<main class="boards-page"><header><div><h1>Vos tableaux</h1><p class="lead">Tous les projets auxquels vous contribuez.</p></div></header>' +
        '<div class="boards-grid">' + cards +
          '<div class="board-card add-card" data-action="newBoard">'+Icon.Plus+'<span>Ajouter un tableau</span></div>' +
        '</div></main>' +
      '</div>';

    bindGlobalActions();
    renderNotifPanel();
  }

  /* ================================================================
     BOARD VIEW
     ================================================================ */
  function renderBoardView() {
    var board = getBoard();
    if (!board) { state.route = "boards"; render(); return; }

    var membersHtml = board.members.map(function(mid) {
      var u = userById(mid);
      return avatarHtml(u.name);
    }).join("");

    var columnsHtml = COLUMNS.map(function(col) {
      var tasks = board.tasks.filter(function(t){ return t.column === col.id; });
      var cardsHtml = tasks.map(function(t) {
        var tp = TASK_TYPES[t.type];
        var a = userById(t.assignee);
        var icons = "";
        if (t.comments.length) icons += '<span class="icon-meta">'+Icon.Comment+' '+t.comments.length+'</span>';
        if (t.attachments.length) icons += '<span class="icon-meta">'+Icon.Paperclip+' '+t.attachments.length+'</span>';
        return '<div class="card" draggable="true" data-task-id="'+t.id+'" data-action="openTask">' +
          '<div class="card-top"><span class="card-type-dot" style="background:'+tp.color+'"></span>' +
          '<span class="card-type-label" style="color:'+tp.color+'">'+tp.label+'</span></div>' +
          '<p class="card-title">'+esc(t.title)+'</p>' +
          '<div class="card-meta">'+avatarHtml(a.name,"sm")+'<div class="icons">'+icons+'</div></div></div>';
      }).join("");

      var addForm = "";
      if (state.addingInCol === col.id) {
        var memberOpts = board.members.map(function(mid) {
          var u = userById(mid); return '<option value="'+mid+'">'+esc(u.pseudo)+'</option>';
        }).join("");
        var typeOpts = Object.keys(TASK_TYPES).map(function(k) {
          return '<option value="'+k+'">'+TASK_TYPES[k].label+'</option>';
        }).join("");
        addForm = '<div class="new-card-form" data-col="'+col.id+'">' +
          '<input placeholder="Titre de la tâche" id="newCardTitle" autofocus />' +
          '<textarea placeholder="Description (optionnelle, supporte @mentions)" id="newCardDesc"></textarea>' +
          '<div class="row"><select id="newCardType">'+typeOpts+'</select><select id="newCardAssignee">'+memberOpts+'</select></div>' +
          '<div class="actions"><button class="btn btn-ghost btn-sm" data-action="cancelNewCard">Annuler</button>' +
          '<button class="btn btn-primary btn-sm" data-action="submitNewCard" data-col="'+col.id+'">Créer</button></div></div>';
      }

      var addBtn = state.addingInCol !== col.id
        ? '<button class="add-card-btn" data-action="addCard" data-col="'+col.id+'">'+Icon.Plus+' Ajouter une tâche</button>'
        : '';

      return '<div class="column" data-col="'+col.id+'">' +
        '<div class="column-head"><div class="title"><span class="col-dot" style="background:'+col.color+'"></span>'+col.title+'</div>' +
        '<span class="count">'+tasks.length+'</span></div>' +
        '<div class="cards" data-col="'+col.id+'">'+cardsHtml+addForm+'</div>'+addBtn+'</div>';
    }).join("");

    root.innerHTML =
      '<div class="app-shell">' +
        headerHtml({
          brandAction: "goBoards",
          crumb: '<div class="crumb"><span data-action="goBoards" style="cursor:pointer">Tableaux</span><span class="sep">/</span><span class="current">'+esc(board.name)+'</span></div>',
          logoutLabel: "Déconnexion"
        }) +
        '<div class="board-toolbar"><h2>'+esc(board.name)+'</h2>' +
          '<div class="member-stack">'+membersHtml+
            '<button class="add-member" data-action="showInvite" title="Inviter un membre">'+Icon.Plus+'</button></div>' +
          '<div class="spacer"></div>' +
          '<button class="btn btn-ghost btn-sm" data-action="showInvite">'+Icon.Users+' Inviter</button></div>' +
        '<div class="board-canvas"><div class="columns">'+columnsHtml+'</div></div>' +
      '</div>';

    bindGlobalActions();
    bindDragDrop();
    renderNotifPanel();
    if (state.openTaskId) renderTaskModal();

    // Focus new card input if form is open
    var nci = document.getElementById("newCardTitle");
    if (nci) {
      nci.focus();
      nci.addEventListener("keydown", function(e) {
        if (e.key === "Enter") { submitNewCard(); }
        if (e.key === "Escape") { state.addingInCol = null; render(); }
      });
    }
  }

  /* ================================================================
     DRAG & DROP
     ================================================================ */
  function bindDragDrop() {
    var cards = document.querySelectorAll(".card[draggable]");
    cards.forEach(function(card) {
      card.addEventListener("dragstart", function(e) {
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.dataset.taskId);
      });
      card.addEventListener("dragend", function() {
        card.classList.remove("dragging");
        document.querySelectorAll(".column.dragover").forEach(function(c){ c.classList.remove("dragover"); });
      });
    });
    document.querySelectorAll(".column").forEach(function(col) {
      col.addEventListener("dragover", function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        col.classList.add("dragover");
      });
      col.addEventListener("dragleave", function(e) {
        if (!col.contains(e.relatedTarget)) col.classList.remove("dragover");
      });
      col.addEventListener("drop", function(e) {
        e.preventDefault();
        col.classList.remove("dragover");
        var taskId = e.dataTransfer.getData("text/plain");
        var colId = col.dataset.col;
        var board = getBoard();
        var task = board.tasks.find(function(t){ return t.id === taskId; });
        if (task && task.column !== colId) {
          var fromCol = COLUMNS.find(function(c){ return c.id === task.column; });
          var toCol = COLUMNS.find(function(c){ return c.id === colId; });
          task.column = colId;
          task.history.push({ at: new Date().toISOString(), text: "Déplacée de " + fromCol.title + " vers " + toCol.title });
          render();
        }
      });
    });
  }

  /* ================================================================
     NEW CARD
     ================================================================ */
  function submitNewCard() {
    var titleEl = document.getElementById("newCardTitle");
    var descEl = document.getElementById("newCardDesc");
    var typeEl = document.getElementById("newCardType");
    var assigneeEl = document.getElementById("newCardAssignee");
    if (!titleEl || !titleEl.value.trim()) return;
    var board = getBoard();
    var assigneeId = assigneeEl ? assigneeEl.value : ME.id;
    var newTask = {
      id: uid("t"), title: titleEl.value.trim(), description: (descEl?descEl.value.trim():""),
      type: typeEl ? typeEl.value : "standard", column: state.addingInCol,
      assignee: assigneeId, comments: [], attachments: [],
      history: [
        { at: new Date().toISOString(), text: "Tâche créée par " + ME.pseudo },
        { at: new Date().toISOString(), text: "Assignée à " + userById(assigneeId).pseudo },
      ],
    };
    board.tasks.push(newTask);
    state.addingInCol = null;
    render();
  }

  /* ================================================================
     TASK MODAL
     ================================================================ */
  function renderTaskModal() {
    var task = getTask(state.openTaskId);
    var board = getBoard();
    if (!task || !board) return;
    var tp = TASK_TYPES[task.type];
    var assignee = userById(task.assignee);

    // Remove existing modal
    var old = document.getElementById("taskModal");
    if (old) old.remove();

    var typeOpts = Object.keys(TASK_TYPES).map(function(k){
      return '<option value="'+k+'"'+(k===task.type?' selected':'')+'>'+TASK_TYPES[k].label+'</option>';
    }).join("");

    var assigneeOpts = board.members.map(function(mid){
      var u = userById(mid);
      return '<option value="'+mid+'"'+(mid===task.assignee?' selected':'')+'>@'+esc(u.pseudo)+'</option>';
    }).join("");

    var colOpts = COLUMNS.map(function(c){
      return '<option value="'+c.id+'"'+(c.id===task.column?' selected':'')+'>'+c.title+'</option>';
    }).join("");

    var attachHtml = "";
    if (task.attachments.length) {
      attachHtml = '<div class="attach-list">' + task.attachments.map(function(a){
        return '<div class="attach-item"><span class="icon">'+Icon.File+'</span>' +
          '<span class="name">'+esc(a.name)+'</span><span class="size">'+fmtSize(a.size)+'</span>' +
          '<button class="rm" data-action="rmAttach" data-aid="'+a.id+'">'+Icon.Trash+'</button></div>';
      }).join("") + '</div>';
    }

    var commentsHtml = task.comments.map(function(c){
      var u = userById(c.author);
      return '<div class="comment">'+avatarHtml(u.name)+'<div class="body">' +
        '<div class="meta"><span class="who">'+esc(u.pseudo)+'</span><span class="when">'+fmtRelative(c.at)+'</span></div>' +
        '<div class="text">'+renderMentions(c.text)+'</div></div></div>';
    }).join("");

    var historyHtml = task.history.slice().reverse().map(function(h){
      return '<div class="history-item"><span class="when">'+fmtRelative(h.at)+'</span><span class="what">'+esc(h.text)+'</span></div>';
    }).join("");

    var modal = document.createElement("div");
    modal.id = "taskModal";
    modal.className = "modal-backdrop";
    modal.innerHTML =
      '<div class="modal" id="modalInner">' +
        '<div class="modal-main">' +
          '<div class="modal-head">' +
            '<select class="type-pill" id="modalType" style="border-color:'+tp.color+';color:'+tp.color+';background:transparent">'+typeOpts+'</select>' +
            '<button class="icon-btn modal-close" data-action="closeModal">'+Icon.X+'</button>' +
          '</div>' +
          '<h2 class="modal-title" id="modalTitle" title="Cliquer pour modifier">'+esc(task.title)+'</h2>' +
          '<div class="modal-sub">Tableau « '+esc(board.name)+' » · Créée le '+fmtDateTime(task.history[0].at)+'</div>' +
          '<div style="margin-bottom:22px"><p class="section-label">Description</p>' +
            '<div class="desc-display'+(task.description?'':' empty')+'" id="modalDesc">' +
              (task.description ? renderMentions(task.description) : 'Ajouter une description… (utilisez @pseudo pour notifier)') +
            '</div></div>' +
          '<div style="margin-bottom:22px"><p class="section-label">Pièces jointes ('+task.attachments.length+')</p>' +
            attachHtml +
            '<label class="attach-add">'+Icon.Plus+' Ajouter une pièce jointe<input type="file" hidden id="modalFileInput" /></label></div>' +
          '<div><p class="section-label">Commentaires ('+task.comments.length+')</p>' +
            '<div class="comment-thread">'+commentsHtml+'</div>' +
            '<div class="comment-form">'+avatarHtml(ME.name)+
              '<textarea id="modalComment" placeholder="Écrire un commentaire… (Ctrl+Entrée pour envoyer, @ pour mentionner)"></textarea>' +
              '<button class="btn btn-primary btn-sm send" data-action="sendComment">'+Icon.Send+' Envoyer</button>' +
              '<div class="mention-popup" id="mentionPopup" style="display:none;bottom:70px;left:50px"></div>' +
            '</div></div>' +
        '</div>' +
        '<aside class="modal-side">' +
          '<div class="side-block"><label>Assigné·e à</label>' +
            '<div class="assignee-row" style="margin-bottom:8px">'+avatarHtml(assignee.name)+
              '<div><div class="name">'+esc(assignee.name)+'</div><div style="font-size:11px;color:var(--text-subtle)">@'+esc(assignee.pseudo)+'</div></div></div>' +
            '<select class="assignee-select" id="modalAssignee">'+assigneeOpts+'</select></div>' +
          '<div class="side-block"><label>Colonne</label><select class="assignee-select" id="modalColumn">'+colOpts+'</select></div>' +
          '<div class="side-block"><label>Historique</label><div class="history-list">'+historyHtml+'</div></div>' +
          '<div style="margin-top:auto;padding-top:16px;border-top:1px solid var(--border)">' +
            '<button class="btn btn-danger btn-sm btn-block" data-action="deleteTask">'+Icon.Trash+' Supprimer la tâche</button></div>' +
        '</aside>' +
      '</div>';

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener("click", function(e) {
      if (e.target === modal) { state.openTaskId = null; modal.remove(); }
    });

    // Stop propagation on inner
    document.getElementById("modalInner").addEventListener("click", function(e){ e.stopPropagation(); });

    // Title edit
    document.getElementById("modalTitle").addEventListener("click", function() {
      var h2 = document.getElementById("modalTitle");
      var input = document.createElement("input");
      input.className = "modal-title-edit";
      input.value = task.title;
      h2.replaceWith(input);
      input.focus();
      function save() {
        if (input.value.trim() && input.value !== task.title) {
          task.title = input.value.trim();
          task.history.push({ at: new Date().toISOString(), text: "Titre modifié" });
        }
        state.openTaskId = task.id; render(); renderTaskModal();
      }
      input.addEventListener("blur", save);
      input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") save();
        if (e.key === "Escape") { state.openTaskId = task.id; render(); renderTaskModal(); }
      });
    });

    // Description edit
    document.getElementById("modalDesc").addEventListener("click", function() {
      var div = document.getElementById("modalDesc");
      var ta = document.createElement("textarea");
      ta.className = "desc-edit";
      ta.value = task.description;
      div.replaceWith(ta);
      ta.focus();
      var wrapper = document.createElement("div");
      wrapper.style.marginBottom = "22px";
      ta.parentNode.insertBefore(wrapper, ta);
      wrapper.appendChild(ta);
      var btns = document.createElement("div");
      btns.style.cssText = "display:flex;gap:6px;margin-top:8px";
      btns.innerHTML = '<button class="btn btn-primary btn-sm" id="descSave">Enregistrer</button><button class="btn btn-ghost btn-sm" id="descCancel">Annuler</button>';
      wrapper.appendChild(btns);
      document.getElementById("descSave").onclick = function() {
        var oldDesc = task.description;
        task.description = ta.value;
        if (ta.value !== oldDesc) {
          task.history.push({ at: new Date().toISOString(), text: "Description modifiée" });
          var newM = collectMentions(ta.value).filter(function(m){ return collectMentions(oldDesc).indexOf(m) === -1; });
          newM.forEach(function(m){ handleMention(m, task, "description"); });
        }
        state.openTaskId = task.id; render(); renderTaskModal();
      };
      document.getElementById("descCancel").onclick = function() { state.openTaskId = task.id; render(); renderTaskModal(); };
    });

    // Type change
    document.getElementById("modalType").addEventListener("change", function(e) {
      if (e.target.value !== task.type) {
        task.type = e.target.value;
        task.history.push({ at: new Date().toISOString(), text: "Type changé en " + TASK_TYPES[task.type].label });
        state.openTaskId = task.id; render(); renderTaskModal();
      }
    });

    // Assignee change
    document.getElementById("modalAssignee").addEventListener("change", function(e) {
      if (e.target.value !== task.assignee) {
        var oldA = userById(task.assignee), newA = userById(e.target.value);
        task.assignee = e.target.value;
        task.history.push({ at: new Date().toISOString(), text: "Réassignée de " + oldA.pseudo + " à " + newA.pseudo });
        state.openTaskId = task.id; render(); renderTaskModal();
      }
    });

    // Column change
    document.getElementById("modalColumn").addEventListener("change", function(e) {
      if (e.target.value !== task.column) {
        var fromCol = COLUMNS.find(function(c){ return c.id === task.column; });
        var toCol = COLUMNS.find(function(c){ return c.id === e.target.value; });
        task.column = e.target.value;
        task.history.push({ at: new Date().toISOString(), text: "Déplacée de " + fromCol.title + " vers " + toCol.title });
        state.openTaskId = task.id; render(); renderTaskModal();
      }
    });

    // Close modal
    modal.querySelectorAll('[data-action="closeModal"]').forEach(function(btn){
      btn.onclick = function(){ state.openTaskId = null; modal.remove(); render(); };
    });

    // Delete task
    modal.querySelectorAll('[data-action="deleteTask"]').forEach(function(btn){
      btn.onclick = function(){
        if (confirm("Supprimer cette tâche ?")) {
          var b = getBoard();
          b.tasks = b.tasks.filter(function(t){ return t.id !== task.id; });
          state.openTaskId = null; modal.remove(); render();
        }
      };
    });

    // Remove attachment
    modal.querySelectorAll('[data-action="rmAttach"]').forEach(function(btn){
      btn.onclick = function(){
        task.attachments = task.attachments.filter(function(a){ return a.id !== btn.dataset.aid; });
        state.openTaskId = task.id; render(); renderTaskModal();
      };
    });

    // Add attachment
    document.getElementById("modalFileInput").addEventListener("change", function(e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      task.attachments.push({ id: uid("a"), name: f.name, size: f.size });
      task.history.push({ at: new Date().toISOString(), text: ME.pseudo + " a ajouté " + f.name });
      state.openTaskId = task.id; render(); renderTaskModal();
    });

    // Comment
    var commentTa = document.getElementById("modalComment");
    var mentionPopup = document.getElementById("mentionPopup");

    commentTa.addEventListener("input", function() {
      var cur = commentTa.selectionStart;
      var before = commentTa.value.slice(0, cur);
      var m = before.match(/@(\w*)$/);
      if (m) {
        var query = m[1].toLowerCase();
        var matches = ALL_USERS.filter(function(u) {
          return board.members.indexOf(u.id) !== -1 && u.pseudo.startsWith(query);
        }).slice(0, 5);
        if (matches.length) {
          mentionPopup.style.display = "block";
          mentionPopup.innerHTML = matches.map(function(u) {
            return '<div class="item" data-pseudo="'+u.pseudo+'">'+avatarHtml(u.name,"sm")+'<span>@'+esc(u.pseudo)+'</span></div>';
          }).join("");
          mentionPopup.querySelectorAll(".item").forEach(function(item) {
            item.onclick = function() {
              var pseudo = item.dataset.pseudo;
              var cur2 = commentTa.selectionStart;
              var before2 = commentTa.value.slice(0, cur2).replace(/@(\w*)$/, "@" + pseudo + " ");
              var after2 = commentTa.value.slice(cur2);
              commentTa.value = before2 + after2;
              mentionPopup.style.display = "none";
              commentTa.focus();
              commentTa.setSelectionRange(before2.length, before2.length);
            };
          });
          return;
        }
      }
      mentionPopup.style.display = "none";
    });

    commentTa.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendComment(task, board); }
      if (e.key === "Escape") mentionPopup.style.display = "none";
    });

    modal.querySelectorAll('[data-action="sendComment"]').forEach(function(btn){
      btn.onclick = function(){ sendComment(task, board); };
    });
  }

  function sendComment(task, board) {
    var ta = document.getElementById("modalComment");
    if (!ta || !ta.value.trim()) return;
    var c = { id: uid("c"), author: ME.id, at: new Date().toISOString(), text: ta.value.trim() };
    task.comments.push(c);
    task.history.push({ at: c.at, text: ME.pseudo + " a commenté" });
    collectMentions(ta.value).forEach(function(m){ handleMention(m, task, "commentaire"); });
    state.openTaskId = task.id; render(); renderTaskModal();
  }

  function handleMention(pseudo, task, kind) {
    if (pseudo === ME.pseudo) return;
    var u = ALL_USERS.find(function(x){ return x.pseudo === pseudo; });
    if (!u) return;
    // In real app, this would notify the mentioned user.
    // For demo, if ME is mentioned we add a notif.
    if (u.id === ME.id) {
      state.notifs.unshift({
        id: uid("n"), from: ME.id, at: new Date().toISOString(),
        taskId: task.id, taskTitle: task.title, kind: kind, unread: true,
      });
    }
  }

  /* ================================================================
     NOTIFICATIONS PANEL
     ================================================================ */
  function renderNotifPanel() {
    var old = document.getElementById("notifPanel");
    if (old) old.remove();
    if (!state.showNotifs) return;

    var overlay = document.createElement("div");
    overlay.id = "notifPanel";
    overlay.style.cssText = "position:fixed;inset:0;z-index:35";
    overlay.onclick = function(){ state.showNotifs = false; overlay.remove(); };

    var panel = document.createElement("div");
    panel.className = "notif-panel";
    panel.onclick = function(e){ e.stopPropagation(); };

    var items = "";
    if (state.notifs.length === 0) {
      items = '<div class="notif-empty">Aucune notification.</div>';
    } else {
      items = state.notifs.map(function(n) {
        var author = userById(n.from);
        return '<div class="notif-item'+(n.unread?' unread':'')+'" data-nid="'+n.id+'">' +
          (n.unread?'<span class="dot"></span>':'') +
          avatarHtml(author.name,"sm") +
          '<div class="body"><div class="text"><b>@'+esc(author.pseudo)+'</b> vous a mentionné' +
            (n.kind==="commentaire"?" dans un commentaire":" dans la description") +
            ' de <b>'+esc(n.taskTitle)+'</b></div>' +
          '<div class="when">'+fmtRelative(n.at)+'</div></div></div>';
      }).join("");
    }

    panel.innerHTML =
      '<header><span>Notifications</span>' +
        (state.notifs.length>0?'<button class="clear" id="clearNotifs">Tout marquer comme lu</button>':'') +
      '</header><div class="notif-list">'+items+'</div>';

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Clear all
    var clearBtn = document.getElementById("clearNotifs");
    if (clearBtn) clearBtn.onclick = function() {
      state.notifs.forEach(function(n){ n.unread = false; });
      state.showNotifs = false; render();
    };

    // Click on notif
    panel.querySelectorAll(".notif-item").forEach(function(el) {
      el.addEventListener("click", function() {
        var nid = el.dataset.nid;
        var n = state.notifs.find(function(x){ return x.id === nid; });
        if (n) {
          n.unread = false;
          for (var i = 0; i < state.boards.length; i++) {
            var t = state.boards[i].tasks.find(function(t){ return t.id === n.taskId; });
            if (t) { state.route = "board"; state.boardId = state.boards[i].id; state.openTaskId = n.taskId; break; }
          }
        }
        state.showNotifs = false;
        render();
      });
    });
  }

  /* ================================================================
     INVITE MODAL
     ================================================================ */
  function showInviteModal() {
    var board = getBoard();
    if (!board) return;
    var old = document.getElementById("inviteModal");
    if (old) old.remove();

    var backdrop = document.createElement("div");
    backdrop.id = "inviteModal";
    backdrop.className = "modal-backdrop";
    backdrop.onclick = function(e){ if (e.target === backdrop) backdrop.remove(); };

    function buildContent(search) {
      var candidates = ALL_USERS.filter(function(u) {
        return board.members.indexOf(u.id) === -1 &&
          (search === "" || u.pseudo.indexOf(search.toLowerCase()) !== -1 || u.name.toLowerCase().indexOf(search.toLowerCase()) !== -1);
      });
      var current = board.members.map(function(mid){ return userById(mid); });

      var sugHtml = "";
      if (candidates.length) {
        sugHtml = '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-subtle);margin-top:16px;margin-bottom:8px">Suggestions</div>' +
          '<div class="members-list">' + candidates.map(function(u){
            return '<div class="member-row">'+avatarHtml(u.name,"sm")+
              '<div style="flex:1"><div>'+esc(u.name)+'</div><div class="role">@'+esc(u.pseudo)+'</div></div>' +
              '<button class="btn btn-ghost btn-sm" data-action="invite" data-uid="'+u.id+'">Inviter</button></div>';
          }).join("") + '</div>';
      }
      var curHtml = '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-subtle);margin-top:16px;margin-bottom:8px">Membres ('+current.length+')</div>' +
        '<div class="members-list">' + current.map(function(u){
          return '<div class="member-row">'+avatarHtml(u.name,"sm")+
            '<div style="flex:1"><div>'+esc(u.name)+'</div><div class="role">@'+esc(u.pseudo)+(u.id===ME.id?' · vous':'')+'</div></div></div>';
        }).join("") + '</div>';

      return sugHtml + curHtml;
    }

    var inner = document.createElement("div");
    inner.className = "invite-modal";
    inner.onclick = function(e){ e.stopPropagation(); };
    inner.innerHTML =
      '<header><h3>Inviter des membres</h3><button class="icon-btn" data-action="closeInvite">'+Icon.X+'</button></header>' +
      '<div class="body"><div class="field" style="margin:0"><input placeholder="Rechercher un pseudo…" id="inviteSearch" /></div>' +
      '<div id="inviteList">'+buildContent("")+'</div></div>';

    backdrop.appendChild(inner);
    document.body.appendChild(backdrop);

    inner.querySelector('[data-action="closeInvite"]').onclick = function(){ backdrop.remove(); };

    var searchInput = document.getElementById("inviteSearch");
    searchInput.addEventListener("input", function() {
      document.getElementById("inviteList").innerHTML = buildContent(searchInput.value);
      bindInviteButtons();
    });

    function bindInviteButtons() {
      inner.querySelectorAll('[data-action="invite"]').forEach(function(btn) {
        btn.onclick = function() {
          var userId = btn.dataset.uid;
          if (board.members.indexOf(userId) === -1) {
            board.members.push(userId);
            updateBoard(board);
            document.getElementById("inviteList").innerHTML = buildContent(searchInput.value);
            bindInviteButtons();
            render();
            // Re-show invite modal
            backdrop.remove();
            showInviteModal();
          }
        };
      });
    }
    bindInviteButtons();
  }

  /* ================================================================
     NEW BOARD + STRIPE MODAL
     ================================================================ */
  function showNewBoardModal() {
    var old = document.getElementById("newBoardModal");
    if (old) old.remove();

    var backdrop = document.createElement("div");
    backdrop.id = "newBoardModal";
    backdrop.className = "modal-backdrop";
    backdrop.onclick = function(e){ if (e.target === backdrop) backdrop.remove(); };

    var inner = document.createElement("div");
    inner.className = "stripe-modal";
    inner.onclick = function(e){ e.stopPropagation(); };
    inner.innerHTML =
      '<header><h3>Nouveau tableau</h3><button class="icon-btn" data-action="closeNewBoard">'+Icon.X+'</button></header>' +
      '<div class="body"><div class="field"><label>Nom du tableau</label>' +
        '<input type="text" id="newBoardName" value="Nouveau tableau" placeholder="ex. Refonte Site Vitrine" autofocus /></div>' +
        '<p style="font-size:12px;color:var(--text-muted);margin-top:4px">La création d\'un tableau nécessite un paiement Stripe (sandbox).</p></div>' +
      '<div class="footer"><button class="btn btn-ghost" data-action="closeNewBoard">Annuler</button>' +
        '<button class="btn btn-primary" id="proceedPay">'+Icon.CreditCard+' Procéder au paiement</button></div>';

    backdrop.appendChild(inner);
    document.body.appendChild(backdrop);

    inner.querySelectorAll('[data-action="closeNewBoard"]').forEach(function(btn){
      btn.onclick = function(){ backdrop.remove(); };
    });

    document.getElementById("newBoardName").addEventListener("keydown", function(e){
      if (e.key === "Enter") document.getElementById("proceedPay").click();
    });

    document.getElementById("proceedPay").onclick = function() {
      var name = document.getElementById("newBoardName").value.trim();
      if (!name) return;
      showStripeModal(name, backdrop);
    };

    document.getElementById("newBoardName").focus();
    document.getElementById("newBoardName").select();
  }

  function showStripeModal(name, parentBackdrop) {
    if (parentBackdrop) parentBackdrop.remove();

    var backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.onclick = function(e){ if (e.target === backdrop) backdrop.remove(); };

    var inner = document.createElement("div");
    inner.className = "stripe-modal";
    inner.onclick = function(e){ e.stopPropagation(); };
    inner.innerHTML =
      '<header><h3>Paiement <span class="sandbox-tag">'+Icon.Lock+' Sandbox</span></h3><button class="icon-btn" data-action="closeStripe">'+Icon.X+'</button></header>' +
      '<div class="body">' +
        '<div class="price-row"><div><div style="font-size:12px;color:var(--text-muted)">Tableau « '+esc(name)+' »</div>' +
          '<div style="font-size:11px;color:var(--text-subtle)">Licence à vie · Équipe illimitée</div></div>' +
          '<div class="amount">9,99 €</div></div>' +
        '<div class="field"><label>Numéro de carte</label><input value="4242 4242 4242 4242" id="stripeNum" /></div>' +
        '<div style="display:flex;gap:12px"><div class="field" style="flex:1"><label>Expiration</label><input value="12/29" /></div>' +
        '<div class="field" style="flex:1"><label>CVC</label><input value="123" /></div></div>' +
      '</div>' +
      '<div class="footer"><button class="btn btn-ghost" data-action="closeStripe">Annuler</button>' +
        '<button class="btn btn-primary" id="payBtn">Payer 9,99 €</button></div>';

    backdrop.appendChild(inner);
    document.body.appendChild(backdrop);

    inner.querySelectorAll('[data-action="closeStripe"]').forEach(function(btn){
      btn.onclick = function(){ backdrop.remove(); };
    });

    document.getElementById("payBtn").onclick = function() {
      var btn = document.getElementById("payBtn");
      btn.disabled = true;
      btn.textContent = "Traitement…";
      setTimeout(function() {
        backdrop.remove();
        var newB = { id: uid("b"), name: name, members: [ME.id], createdAt: new Date().toISOString(), tasks: [] };
        state.boards.push(newB);
        state.route = "board";
        state.boardId = newB.id;
        render();
      }, 1200);
    };
  }

  /* ================================================================
     THEME TOGGLE
     ================================================================ */
  function renderThemeToggle() {
    var old = document.getElementById("themeToggle");
    if (old) old.remove();
    var btn = document.createElement("button");
    btn.id = "themeToggle";
    btn.className = "theme-toggle";
    btn.title = state.theme === "light" ? "Mode sombre" : "Mode clair";
    btn.innerHTML = state.theme === "light" ? Icon.Moon : Icon.Sun;
    btn.onclick = function() {
      state.theme = state.theme === "light" ? "dark" : "light";
      render();
    };
    document.body.appendChild(btn);
  }

  /* ================================================================
     GLOBAL ACTION DELEGATION
     ================================================================ */
  function bindGlobalActions() {
    root.querySelectorAll("[data-action]").forEach(function(el) {
      el.addEventListener("click", function(e) {
        var action = el.dataset.action;
        if (action === "goBoards") { state.route = "boards"; state.boardId = null; state.openTaskId = null; state.addingInCol = null; render(); }
        else if (action === "logout") { state.route = "auth"; state.openTaskId = null; state.showNotifs = false; render(); }
        else if (action === "toggleNotifs") { state.showNotifs = !state.showNotifs; renderNotifPanel(); }
        else if (action === "openBoard") { state.route = "board"; state.boardId = el.dataset.id; state.addingInCol = null; render(); }
        else if (action === "newBoard") { showNewBoardModal(); }
        else if (action === "openTask") {
          e.stopPropagation();
          var card = el.closest("[data-task-id]");
          if (card) { state.openTaskId = card.dataset.taskId; renderTaskModal(); }
        }
        else if (action === "addCard") { state.addingInCol = el.dataset.col; render(); }
        else if (action === "cancelNewCard") { state.addingInCol = null; render(); }
        else if (action === "submitNewCard") { submitNewCard(); }
        else if (action === "showInvite") { showInviteModal(); }
      });
    });
  }

  /* ---- boot ---- */
  render();
})();
