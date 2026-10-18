// LocalStorage에 저장할 때 쓰는 키
const STORAGE_KEY = "todos";

// 할 일 목록 상태 (LocalStorage와 동기화)
// 각 항목: { id, text, date, completed }
let todos = loadTodos();
// 다음 id는 저장된 항목 중 가장 큰 id + 1
let nextId = todos.reduce((max, item) => Math.max(max, item.id), 0) + 1;
// 날짜 필터 ("YYYY-MM-DD", null이면 전체 보기)
let filterDate = null;
// 날짜 선택 버튼에 표시되고 새 할 일에 붙는 날짜 (기본값은 오늘)
let selectedDate = getToday();
// 상태 필터 ("all" | "active" | "completed")
let statusFilter = "all";

// LocalStorage에서 할 일 목록 불러오기
function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // 저장소 접근이 막혔거나 데이터가 깨진 경우 빈 목록으로 시작
    return [];
  }
}

// 현재 할 일 목록을 LocalStorage에 저장
function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    // 저장에 실패해도 앱은 계속 동작하도록 무시
  }
}

// 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환
function getToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// "YYYY-MM-DD"를 "M월 D일" 형식으로 변환
function formatDate(dateStr) {
  const [, month, day] = dateStr.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

// 할 일 추가
function addTodo(text, date) {
  todos.push({ id: nextId++, text, date, completed: false });
  saveTodos();
  render();
}

// 완료/미완료 토글
function toggleTodo(id) {
  const todo = todos.find((item) => item.id === id);
  if (todo) {
    todo.completed = !todo.completed;
  }
  saveTodos();
  render();
}

// 할 일 삭제
function deleteTodo(id) {
  todos = todos.filter((item) => item.id !== id);
  saveTodos();
  render();
}

// 같은 날짜에 같은 내용의 할 일이 이미 있는지 확인
function isDuplicate(text, date) {
  return todos.some((item) => item.date === date && item.text === text);
}

// 날짜 필터가 적용된 목록 (날짜 필터가 없으면 전체)
function getDateTodos() {
  return filterDate
    ? todos.filter((item) => item.date === filterDate)
    : todos;
}

// 완료 항목 일괄 삭제 (현재 보고 있는 날짜 범위 안에서만)
function clearCompleted() {
  const targets = getDateTodos().filter((item) => item.completed);
  if (targets.length === 0) {
    return;
  }
  if (!confirm(`완료된 항목 ${targets.length}개를 삭제할까요?`)) {
    return;
  }
  todos = todos.filter((item) => !targets.includes(item));
  saveTodos();
  render();
}

// 상태 필터 설정
function setStatusFilter(status) {
  statusFilter = status;
  render();
}

// 날짜 필터 설정 (null이면 해제)
// 날짜를 지정하면 선택 날짜도 같이 맞추고, 해제(null)하면 오늘로 되돌린다
function setFilter(date) {
  filterDate = date;
  selectedDate = date || getToday();
  render();
}

// 상태(todos, filterDate, selectedDate, statusFilter)를 화면에 그리는 유일한 함수
function render() {
  // 날짜 선택 버튼 갱신
  document.getElementById("date-input").value = selectedDate;
  document.getElementById("date-label").textContent = formatDate(selectedDate);

  // 날짜 필터 적용
  const dateTodos = getDateTodos();

  // 상태 필터 적용 (전체 / 진행중 / 완료)
  const visibleTodos = dateTodos.filter((item) => {
    if (statusFilter === "active") return !item.completed;
    if (statusFilter === "completed") return item.completed;
    return true;
  });

  // 선택된 상태 필터 탭 강조
  document.querySelectorAll(".btn-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.status === statusFilter);
  });

  // 필터 상태 표시 갱신
  const filterBar = document.getElementById("filter-bar");
  filterBar.hidden = !filterDate;
  document.getElementById("filter-clear").hidden = !filterDate;
  if (filterDate) {
    document.getElementById("filter-label").textContent =
      `📅 ${formatDate(filterDate)} 할 일`;
  }

  // 개수 표시 갱신 (날짜 필터 기준, 상태 필터와 무관)
  const completedCount = dateTodos.filter((item) => item.completed).length;
  document.getElementById("todo-count").innerHTML =
    `전체 <strong>${dateTodos.length}</strong>개 · 완료 <strong>${completedCount}</strong>개`;

  // 지울 완료 항목이 없으면 일괄 삭제 버튼 비활성화
  document.getElementById("clear-completed").disabled = completedCount === 0;

  const list = document.getElementById("todo-list");
  list.innerHTML = "";

  visibleTodos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    // textContent를 사용해 입력값이 HTML로 해석되지 않게 함
    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    // 날짜를 클릭하면 그 날짜의 할 일만 보기
    const date = document.createElement("button");
    date.type = "button";
    date.className = "todo-date";
    date.textContent = formatDate(todo.date);
    date.title = "이 날짜의 할 일만 보기";
    date.addEventListener("click", () => setFilter(todo.date));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn-delete";
    deleteButton.textContent = "삭제";
    deleteButton.addEventListener("click", () => deleteTodo(todo.id));

    li.append(checkbox, text, date, deleteButton);
    list.appendChild(li);
  });
}

// 앱 초기화: 이벤트 연결
function initApp() {
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const dateButton = document.getElementById("date-button");
  const dateInput = document.getElementById("date-input");

  // 날짜 버튼 클릭 시 현재 선택 날짜의 할 일만 보여주고 달력 창 열기
  dateButton.addEventListener("click", () => {
    setFilter(selectedDate);

    if (typeof dateInput.showPicker === "function") {
      dateInput.showPicker();
    } else {
      // showPicker를 지원하지 않는 브라우저용 대체 동작
      dateInput.focus();
      dateInput.click();
    }
  });

  // 달력에서 날짜를 고르면 그 날짜의 할 일만 보기 (지우면 오늘로)
  dateInput.addEventListener("change", () => {
    setFilter(dateInput.value || getToday());
  });

  // 전체 보기 버튼으로 날짜 필터 해제
  document
    .getElementById("filter-clear")
    .addEventListener("click", () => setFilter(null));

  // 상태 필터 탭 클릭
  document.querySelectorAll(".btn-tab").forEach((tab) => {
    tab.addEventListener("click", () => setStatusFilter(tab.dataset.status));
  });

  // 완료된 항목 삭제 버튼
  document
    .getElementById("clear-completed")
    .addEventListener("click", clearCompleted);

  // 추가 버튼 클릭과 Enter 키 모두 form submit으로 처리
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = input.value.trim();
    if (text === "") {
      alert("할 일을 입력하세요");
      input.focus();
      return;
    }

    if (isDuplicate(text, selectedDate)) {
      alert("이미 등록된 할 일입니다");
      input.focus();
      return;
    }

    addTodo(text, selectedDate);
    input.value = "";
    input.focus();
  });

  render();
}

initApp();
