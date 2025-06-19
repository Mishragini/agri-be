import express from "express"
import cors from 'cors'
import { user_router } from "./routes/user";
import { product_router } from "./routes/product";
import { booking_router } from "./routes/booking";
const app = express()

app.use(express.json());

app.use(cors({
    origin: '*'
}))
app.use('/api/users', user_router);
app.use('/api/products', product_router)
app.use('/api/bookings', booking_router)
app.listen(3000, () => {
    console.log(`App started listening on PORT 3000`)
})