import { useEffect, useState } from 'react'
import './App.css'

function App() {
	//Массив данных
	const [todos, setTodos] = useState(() => {
		//Сохранение массива в localStorage
		const savedTodos = localStorage.getItem('todos');
		return savedTodos ? JSON.parse(savedTodos) : [];
	});
	// Состояние для хранения текста из поля ввода
	const [inputValue, setInputValue] = useState('');
	// Используем useEffect для сохранения в localStorage
	useEffect(() => {
		localStorage.setItem('todos', JSON.stringify(todos));
	}, [todos]);

	const activeTodos = todos.filter(todo => !todo.completed);
	const completedTodos = todos.filter(todo => todo.completed);

	// Определение свойств массива todo 
	const addTodo = (e) => {
		e.preventDefault();
		if (inputValue.trim()) {
			const newTodo = {
				id: Date.now(),
				text: inputValue,
				completed: false
			};
			setTodos([...todos, newTodo]);
			setInputValue('');
		}
	};
	//переключение статуса задачи
	const toggleTodo = (id) => {
		setTodos(todos.map(todo =>
			todo.id === id ? { ...todo, completed: !todo.completed } : todo
		));
	}
	//удаление задачи
	const deleteTodo = (id) => {
		setTodos(todos.filter(todo => todo.id !== id));
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
