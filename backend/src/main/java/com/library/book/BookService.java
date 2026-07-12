package com.library.book;

import com.library.book.dto.BookRequest;
import com.library.book.dto.BookResponse;
import com.library.common.exception.BusinessException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.location.ShelfRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class BookService {

    private final BookRepository bookRepository;
    private final ShelfRepository shelfRepository;

    public BookService(BookRepository bookRepository, ShelfRepository shelfRepository) {
        this.bookRepository = bookRepository;
        this.shelfRepository = shelfRepository;
    }

    public Page<BookResponse> getBooks(String title, String author, String isbn, Pageable pageable) {
        return bookRepository.search(title, author, isbn, pageable)
                .map(book -> BookResponse.from(book, availableCopies(book)));
    }

    public BookResponse getBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", id));
        return BookResponse.from(book, availableCopies(book));
    }

    public BookResponse createBook(BookRequest request) {
        if (bookRepository.existsByIsbn(request.isbn())) {
            throw new BusinessException("ISBN already exists: " + request.isbn());
        }

        shelfRepository.findById(request.shelfId())
                .orElseThrow(() -> new ResourceNotFoundException("Shelf", request.shelfId()));

        Book book = new Book();
        book.setTitle(request.title());
        book.setAuthor(request.author());
        book.setIsbn(request.isbn());
        book.setPublisher(request.publisher());
        book.setPublicationYear(request.publicationYear());
        book.setCopiesCount(request.copiesCount());
        book.setShelfId(request.shelfId());
        book = bookRepository.save(book);
        return BookResponse.from(book, availableCopies(book));
    }

    public BookResponse updateBook(Long id, BookRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", id));

        if (!book.getIsbn().equals(request.isbn()) && bookRepository.existsByIsbn(request.isbn())) {
            throw new BusinessException("ISBN already exists: " + request.isbn());
        }

        shelfRepository.findById(request.shelfId())
                .orElseThrow(() -> new ResourceNotFoundException("Shelf", request.shelfId()));

        book.setTitle(request.title());
        book.setAuthor(request.author());
        book.setIsbn(request.isbn());
        book.setPublisher(request.publisher());
        book.setPublicationYear(request.publicationYear());
        book.setCopiesCount(request.copiesCount());
        book.setShelfId(request.shelfId());
        book = bookRepository.save(book);
        return BookResponse.from(book, availableCopies(book));
    }

    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", id));

        if (bookRepository.countActiveBorrowings(book.getId()) > 0) {
            throw new BusinessException("Cannot delete book: currently borrowed");
        }

        bookRepository.delete(book);
    }

    private int availableCopies(Book book) {
        return book.getCopiesCount() - (int) bookRepository.countActiveBorrowings(book.getId());
    }
}
