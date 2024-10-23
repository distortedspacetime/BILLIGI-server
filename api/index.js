const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// 앱 생성
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Atlas에 연결되었습니다.'))
  .catch((err) => console.error('MongoDB 연결 실패:', err));

// Item 모델 정의
const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  owner: { type: String, required: false },
  borrower: { type:String, required: false },
  status: { type: String, enum: ['available', 'borrowed'], required: true },
  type: { type: String, enum: ['borrowing', 'lending'], required: true },
}); 

const Item = mongoose.model('Item', ItemSchema);

// LostFound 모델 정의
const LostFoundSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['lost', 'found'], required: true },
  date: { type: Date, default: Date.now },
});

const LostFound = mongoose.model('LostFound', LostFoundSchema);


app.get("/", (req, res) => {
  try {
    // MongoDB 연결 상태 확인
    const dbStatus = mongoose.connection.readyState === 1 ? '연결됨' : '연결되지 않음';
    res.json({ message: "Express on Vercel", dbStatus: dbStatus });
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
});

// 아이템 관련 라우트
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  const { name, description, type, owner, borrower } = req.body;
  
  const newItem = new Item({
    name: name,
    description: description,
    type: type,
    status: 'available',
    owner: type === 'lending' ? owner : undefined,
    borrower: type === 'borrowing' ? borrower : undefined,
  });

  try {
    const savedItem = await newItem.save();
    res.json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/api/items/:id', async (req, res) => {
  try {
    const updateFields = { status: req.body.status };

    // borrower와 owner 모두 업데이트하도록 수정
    if (req.body.borrower) {
      updateFields.borrower = req.body.borrower;
    }
    if (req.body.owner) {
      updateFields.owner = req.body.owner;
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updateFields, // 업데이트할 필드 객체 사용
      { new: true }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 분실물/습득물 관련 라우트
app.get('/api/lostfound', async (req, res) => {
  try {
    const reports = await LostFound.find();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/lostfound', async (req, res) => {
  const newReport = new LostFound({
    title: req.body.title,
    description: req.body.description,
    status: req.body.status,
  });
  try {
    const savedReport = await newReport.save();
    res.json(savedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`));

//Vercel 배포용
module.exports = app;