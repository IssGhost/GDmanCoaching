import { useState } from "react";
import { motion } from "framer-motion";

export default function PaymentPortal() {
	const [amount, setAmount] = useState("");
	const [status, setStatus] = useState("");

	const handlePay = () => {
		if (amount) {
			setStatus(`Payment of $${amount} initiated.`);
		}
	};

	return (
		<motion.div
			className="bg-white p-8 rounded-xl shadow max-w-md mx-auto"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
		>
			<h2 className="text-2xl font-bold mb-4 text-center">Secure Online Payment</h2>
			<p className="mb-4 text-center">Pay for services, parts, or subscriptions securely.</p>
			<input
				type="number"
				value={amount}
				onChange={(e) => setAmount(e.target.value)}
				placeholder="Enter amount"
				className="border p-2 rounded w-full mb-4"
			/>
			<motion.button
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={handlePay}
				className="bg-green-600 text-white py-3 px-6 rounded-lg w-full hover:bg-green-500"
			>
				Pay Now
			</motion.button>
			{status && <p className="mt-4 text-green-700 text-center">{status}</p>}
		</motion.div>
	);
}
