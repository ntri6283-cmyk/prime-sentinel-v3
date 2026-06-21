const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function testWrite() {
	await mongoose.connect(process.env.MONGO_URI);
	console.log("Da ket noi, dang ghi du lieu test...");

	const TestSchema = new mongoose.Schema({ message: String, createdAt: { type: Date, default: Date.now } });
	const Test = mongoose.model('Test', TestSchema);

	await Test.create({ message: "Hello from Prime Sentinel test" });
	console.log("✅ Da ghi du lieu test thanh cong!");

	await mongoose.disconnect();
}

testWrite().catch(err => console.error("❌ Loi:", err.message));
