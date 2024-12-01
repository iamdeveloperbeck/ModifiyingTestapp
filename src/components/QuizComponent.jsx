import React, { useEffect, useState } from "react";
import { db } from "../data/firebase";
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';

function QuizComponent() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [userInfo, setUserInfo] = useState({ firstName: '', lastName: '', correct: 0, incorrect: 0, result: '', answers: [] });
  const [quizStarted, setQuizStarted] = useState(false);
  const [userId, setUserId] = useState(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "Questions"));
        const categoriesData = snapshot.docs.map((doc) => doc.data().category);
        const uniqueCategories = [...new Set(categoriesData)];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Kategoriyalarni olishda xato:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const fetchQuestions = async () => {
        try {
          const q = query(collection(db, "Questions"), where("category", "==", selectedCategory));
          const snapshot = await getDocs(q);
          let questionsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          questionsData = shuffleArray(questionsData);
          setQuestions(questionsData);
          setLoading(false);
        } catch (error) {
          console.error("Savollarni olishda xato:", error);
        }
      };
      fetchQuestions();
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (!quizStarted) return;
    if (timeLeft === 0) {
      handleNextQuestion(false);
    }
    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, quizStarted]);

  const handleAnswer = (choice) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = choice === currentQuestion.correctAnswer;

    const updatedUserInfo = { ...userInfo };
    if (!updatedUserInfo.answers) {
      updatedUserInfo.answers = [];
    }
    updatedUserInfo.answers.push({
      question: currentQuestion.question,
      givenAnswer: choice,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect
    });

    handleNextQuestion(isCorrect);
  };

  const handleNextQuestion = async (isCorrect) => {
    const updatedUserInfo = { ...userInfo };

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
      updatedUserInfo.correct += 1;
    } else {
      setIncorrectAnswers((prev) => prev + 1);
      updatedUserInfo.incorrect += 1;
    }

    setUserInfo(updatedUserInfo);

    if (currentQuestionIndex >= questions.length - 1) {
      await determineResult(updatedUserInfo.correct);
      setQuizFinished(true);
    } else {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setTimeLeft(30);
    }

    // User ma'lumotlarini darhol saqlash o'rniga kechiktirib saqlaymiz
    setTimeout(() => saveUserInfo(updatedUserInfo), 2000);
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const saveUserInfo = async (userInfo) => {
    if (userId) {
      const userDoc = doc(db, "Users", userId);
      await updateDoc(userDoc, userInfo);
    } else {
      const userDocRef = await addDoc(collection(db, "Users"), userInfo);
      setUserId(userDocRef.id);
    }
  };

  const determineResult = async (correctAnswers) => {
    const updatedUserInfo = { ...userInfo };

    // 50 talik va 30 talik testlar uchun shartlarni qo'yamiz
    if (questions.length === 50 && correctAnswers >= 28) {
      setResultMessage("Tabriklaymiz! Siz testdan o'tdingiz.");
      updatedUserInfo.result = "O'tdi";
    } else if (questions.length === 30 && correctAnswers >= 18) {
      setResultMessage("Tabriklaymiz! Siz testdan o'tdingiz.");
      updatedUserInfo.result = "O'tdi";
    } else {
      setResultMessage("Afsuski, siz testdan o'ta olmadingiz.");
      updatedUserInfo.result = "O'ta olmadi";
    }

    setUserInfo(updatedUserInfo);
    setTimeout(() => saveUserInfo(updatedUserInfo), 2000); // Ma'lumotlarni kechiktirib saqlash
  };

  const handleStartQuiz = async () => {
    try {
      const q = query(collection(db, "Users"), where("firstName", "==", userInfo.firstName), where("lastName", "==", userInfo.lastName));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setError("Bu ism va familiyaga ega foydalanuvchi allaqachon mavjud.");
        alert("Bu ism va familiyaga ega foydalanuvchi allaqachon mavjud!");
        return;
      }
      setError('');
      const userDocRef = await addDoc(collection(db, "Users"), userInfo);
      setUserId(userDocRef.id);
      setQuizStarted(true);
      setTimeLeft(30); // Start the timer
    } catch (error) {
      console.error("Foydalanuvchi ma'lumotlarini saqlashda xato:", error);
    }
  };

  if (!quizStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-1">
                <h2 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900"><mark className="px-2 text-white bg-blue-600 rounded dark:bg-blue-500">Testni</mark> boshlash</h2>
                <input
                    type="text"
                    placeholder="Ism(Исмингиз)"
                    value={userInfo.firstName}
                    onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                <input
                    type="text"
                    placeholder="Familya(Фамилиянгиз)"
                    value={userInfo.lastName}
                    onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                    <option value="">Yo'nalishni tanlang</option>
                    {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
                <button onClick={handleStartQuiz} disabled={!selectedCategory} className="text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mt-2">Boshlash</button>
            </div>
            <div class="p-4 mt-4 text-sm text-blue-800 rounded-lg bg-blue-50 relative z-10 flex flex-col gap-[5px]" role="alert">
                <p><span class="font-medium text-red-500">Diqqat!</span> Har bir test savoli uchun 30 sekund vaqt belgilangan.</p>
                <span class="font-medium">Ism va Familyangizni to'g'ri kiritganingizga ishonch hosil qiling!</span>
            </div>
      </div>
    );
  }

  if (loading) return <p>Yuklanmoqda...</p>;

  if (quizFinished) {
    return (
      <div className="flex items-center flex-col justify-center h-screen">
        <p className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl"><span className="text-blue-600">Test</span> yakunlandi!</p>
        <p className="mb-4 text-2xl font-extrabold leading-none tracking-tight text-gray-900">To'g'ri javoblar: <span className="text-blue-600">{correctAnswers}</span> ta</p>
        <p className="mb-4 text-2xl font-extrabold leading-none tracking-tight text-gray-900">Noto'g'ri javoblar: <span className="text-blue-600">{incorrectAnswers}</span> ta</p>
        <p className="mt-4 text-2xl font-extrabold leading-none tracking-tight text-gray-900">{resultMessage}</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="p-[260px_0] flex justify-center">
      <div className="w-[520px] border-[1px] p-6 flex flex-col items-start">
        <div className="flex items-center justify-between w-full">
          <p>Savol: {currentQuestionIndex + 1}</p>
          <p>Qolgan vaqt: {timeLeft} soniya</p>
        </div>
        <div className="flex flex-col text-left mt-4 w-full items-start">
          <h3 className="text-[18px] font-bold">{currentQuestion.question}</h3>
          <div className="w-full h-[1px] m-[10px_0] bg-slate-500"></div>
          <ul className="flex flex-col items-start gap-1">
            {currentQuestion.choices.map((choice, index) => (
              <li key={index} className="text-lg font-normal text-gray-500">
                <button className="hover:underline" onClick={() => handleAnswer(choice)}>
                  {choice}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default QuizComponent;
