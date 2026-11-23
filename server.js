const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Sample data is stored in memory and resets whenever the server restarts.
let books = [
    { id: 'B101', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', price: 14.99 },
    { id: 'B102', title: 'To Kill a Mockingbird', author: 'Harper Lee', price: 12.50 },
    { id: 'B103', title: '1984', author: 'George Orwell', price: 15.20 }
];

function findBookIndex(id) {
    return books.findIndex(book => book.id.toLowerCase() === id.trim().toLowerCase());
}

function validateBookFields(title, author, price) {
    if (typeof title !== 'string' || !title.trim() ||
        typeof author !== 'string' || !author.trim() ||
        price === undefined || price === null || price === '') {
        return { error: 'Title, author, and a valid price are required.' };
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return { error: 'Price must be a valid non-negative number.' };
    }

    return {
        title: title.trim(),
        author: author.trim(),
        price: Number(parsedPrice.toFixed(2))
    };
}

app.get('/books', (req, res) => {
    res.status(200).json(books);
});

app.get('/books/:id', (req, res) => {
    const index = findBookIndex(req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: `Book with ID "${req.params.id}" was not found.` });
    }
    res.status(200).json(books[index]);
});

app.post('/books', (req, res) => {
    const { id, title, author, price } = req.body || {};
    if (typeof id !== 'string' || !id.trim()) {
        return res.status(400).json({ error: 'A non-empty book ID is required.' });
    }

    const cleanId = id.trim();
    if (findBookIndex(cleanId) !== -1) {
        return res.status(409).json({ error: `A book with ID "${cleanId}" already exists.` });
    }

    const validated = validateBookFields(title, author, price);
    if (validated.error) {
        return res.status(400).json({ error: validated.error });
    }

    const book = { id: cleanId, title: validated.title, author: validated.author, price: validated.price };
    books.push(book);
    res.status(201).json({ message: 'Book added successfully.', book });
});

app.put('/books/:id', (req, res) => {
    const index = findBookIndex(req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: `Book with ID "${req.params.id}" was not found.` });
    }

    const { title, author, price } = req.body || {};
    const validated = validateBookFields(title, author, price);
    if (validated.error) {
        return res.status(400).json({ error: validated.error });
    }

    books[index] = {
        id: books[index].id,
        title: validated.title,
        author: validated.author,
        price: validated.price
    };
    res.status(200).json({ message: 'Book updated successfully.', book: books[index] });
});

app.delete('/books/:id', (req, res) => {
    const index = findBookIndex(req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: `Book with ID "${req.params.id}" was not found.` });
    }

    const [book] = books.splice(index, 1);
    res.status(200).json({ message: 'Book deleted successfully.', book });
});

// Keep malformed JSON responses consistent with the API's JSON error format.
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Request body contains invalid JSON.' });
    }
    next(err);
});

app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} was not found.` });
});

app.listen(PORT, () => {
    console.log(`Book Management System is running at http://localhost:${PORT}`);
    console.log('Book data is stored in memory and resets when the server restarts.');
});
