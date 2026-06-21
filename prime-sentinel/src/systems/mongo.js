const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function connectMongo() {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log('✅ Da ket noi MongoDB thanh cong!');
	} catch (err) {
		console.error('❌ Loi ket noi MongoDB:', err.message);
	}
}

module.exports = { connectMongo };
