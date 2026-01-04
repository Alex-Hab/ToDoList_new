import { useEffect, useState } from 'react'
import './App.css'
import { openDB } from 'idb'

// Типизация для базы данных (опционально)
const DB_NAME = 'TodoDB';
const DB_VERSION = 1;
const STORE_NAME = 'todos';

// Инициализация IndexedDB
const initDB = async () => {
	try {
		const db = await openDB(DB_NAME, DB_VERSION, {
			upgrade(db, oldVersion, newVersion, transaction) {
				// Создаем хранилище если его нет
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					const store = db.createObjectStore(STORE_NAME, {
						keyPath: 'id',
						autoIncrement: false
					});
					// Создаем индексы для быстрого поиска
					store.createIndex('completed', 'completed');
					store.createIndex('text', 'text');
				}
			},
		});
		return db;
	} catch (error) {
		console.error('Ошибка инициализации базы данных:', error);
		throw error;
	}
};

function App() {
	//Массив данных
	const [todos, setTodos] = useState([]);
	// Состояние для хранения текста из поля ввода
	const [inputValue, setInputValue] = useState('');
	//Массивы для базы данных
	const [db, setDb] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	// Инициализация базы данных при монтировании компонента
	useEffect(() => {
		const initDatabase = async () => {
			try {
				setIsLoading(true);
				const database = await initDB();
				setDb(database);
				await loadTodos(database);
			} catch (error) {
				console.error('Ошибка загрузки данных:', error);
			} finally {
				setIsLoading(false);
			}
		};

		initDatabase();
	}, []);

	// Загрузка задач из IndexedDB
	const loadTodos = async (database = db) => {
		if (!database) return;

		try {
			const tx = database.transaction(STORE_NAME, 'readonly');
			const store = tx.objectStore(STORE_NAME);
			const allTodos = await store.getAll();
			setTodos(allTodos);
		} catch (error) {
			console.error('Ошибка загрузки задач:', error);
		}
	};

	// Сохранение задачи в IndexedDB
	const saveTodo = async (todo) => {
		if (!db) return;

		try {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			await store.put(todo);
			await tx.done;
		} catch (error) {
			console.error('Ошибка сохранения задачи:', error);
		}
	};

	// Удаление задачи из IndexedDB
	const deleteTodoFromDB = async (id) => {
		if (!db) return;

		try {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			await store.delete(id);
			await tx.done;
		} catch (error) {
			console.error('Ошибка удаления задачи:', error);
		}
	};

	// Обновление задачи в IndexedDB
	const updateTodoInDB = async (updatedTodo) => {
		if (!db) return;

		try {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			await store.put(updatedTodo);
			await tx.done;
		} catch (error) {
			console.error('Ошибка обновления задачи:', error);
		}
	};

	const activeTodos = todos.filter(todo => !todo.completed);
	const completedTodos = todos.filter(todo => todo.completed);

	// Определение свойств массива todo 
	const addTodo = async (e) => {
		e.preventDefault();
		if (inputValue.trim() && db) {
			const newTodo = {
				id: Date.now(),
				text: inputValue,
				completed: false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};

			await saveTodo(newTodo);
			await loadTodos(); // Перезагружаем все задачи
			setInputValue('');
		}
	};
	//переключение статуса задачи
	const toggleTodo = async (id) => {
		const todoToUpdate = todos.find(todo => todo.id === id);
		if (!todoToUpdate) return;

		const updatedTodo = {
			...todoToUpdate,
			completed: !todoToUpdate.completed,
			updatedAt: new Date().toISOString()
		};

		await updateTodoInDB(updatedTodo);
		await loadTodos(); // Перезагружаем все задачи
	};

	//удаление задачи
	const deleteTodo = async (id) => {
		await deleteTodoFromDB(id);
		setTodos(todos.filter(todo => todo.id !== id));
	};

	// Очистка всех выполненных задач
	const clearCompleted = async () => {
		if (!db) return;

		try {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			const index = store.index('completed');

			// Получаем все выполненные задачи
			const completed = await index.getAll(true);

			// Удаляем каждую выполненную задачу
			for (const todo of completed) {
				await store.delete(todo.id);
			}

			await tx.done;
			await loadTodos();
		} catch (error) {
			console.error('Ошибка очистки выполненных задач:', error);
		}
	};

	if (isLoading) {
		return <div className="loading">Загрузка...</div>;
	}

	return (
		<div className='App'>
			<div className="title-container">
				<h1>Список задач</h1>
				<form onSubmit={addTodo}>
					<input
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						placeholder='Введите новую задачу...'
					/>
					<button type='submit'>Добавить</button>
				</form>
			</div>
			<div className="tasks-container">
				{/* Блок активных задач */}
				<div className="tasks-column">
					{/*Подсчёт количества задач activeTodos.length*/}
					<h2>Активные задачи: {activeTodos.length}</h2>
					<ul>
						{activeTodos.map(todo => (
							<li key={todo.id}>
								<input
									type='checkbox'
									checked={todo.completed}
									onChange={() => toggleTodo(todo.id)}
								/>
								<span>{todo.text}</span>
								<button onClick={() => deleteTodo(todo.id)}>
									Удалить
								</button>
							</li>
						))}
					</ul>
				</div>

				{/* Блок выполненных задач */}
				<div className="tasks-column">
					<h2>Выполненные задачи: {completedTodos.length}</h2>
					<ul>
						{completedTodos.map(todo => (
							<li key={todo.id} className="completed">
								<input
									type='checkbox'
									checked={todo.completed}
									onChange={() => toggleTodo(todo.id)}
								/>
								<span style={{ textDecoration: 'line-through' }}>
									{todo.text}
								</span>
								<button onClick={() => deleteTodo(todo.id)}>
									Удалить
								</button>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	)
}

export default App
