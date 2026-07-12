package com.library.location;

import com.library.common.exception.BusinessException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.location.dto.AssignLibrarianRequest;
import com.library.location.dto.LocationRequest;
import com.library.location.dto.LocationResponse;
import com.library.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class LocationService {

    private final HallRepository hallRepository;
    private final BookshelfRepository bookshelfRepository;
    private final ShelfRepository shelfRepository;
    private final UserRepository userRepository;

    public LocationService(HallRepository hallRepository,
                           BookshelfRepository bookshelfRepository,
                           ShelfRepository shelfRepository,
                           UserRepository userRepository) {
        this.hallRepository = hallRepository;
        this.bookshelfRepository = bookshelfRepository;
        this.shelfRepository = shelfRepository;
        this.userRepository = userRepository;
    }

    public List<LocationResponse> getAllHalls() {
        return hallRepository.findAll()
                .stream()
                .map(LocationResponse::fromHall)
                .toList();
    }

    public LocationResponse createHall(LocationRequest request) {
        Hall hall = new Hall();
        hall.setName(request.name());
        hall.setDescription(request.description());
        hall = hallRepository.save(hall);
        return LocationResponse.fromHall(hall);
    }

    public LocationResponse updateHall(Long id, LocationRequest request) {
        Hall hall = hallRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hall", id));
        hall.setName(request.name());
        hall.setDescription(request.description());
        hall = hallRepository.save(hall);
        return LocationResponse.fromHall(hall);
    }

    public void deleteHall(Long id) {
        if (shelfRepository.hasBooksByHallId(id)) {
            throw new BusinessException("Cannot delete hall: contains books");
        }
        hallRepository.deleteById(id);
    }

    public List<LocationResponse> getBookshelvesByHall(Long hallId) {
        return bookshelfRepository.findByHallId(hallId)
                .stream()
                .map(LocationResponse::fromBookshelf)
                .toList();
    }

    public LocationResponse createBookshelf(Long hallId, LocationRequest request) {
        hallRepository.findById(hallId)
                .orElseThrow(() -> new ResourceNotFoundException("Hall", hallId));
        Bookshelf bookshelf = new Bookshelf();
        bookshelf.setName(request.name());
        bookshelf.setHallId(hallId);
        bookshelf = bookshelfRepository.save(bookshelf);
        return LocationResponse.fromBookshelf(bookshelf);
    }

    public LocationResponse updateBookshelf(Long id, LocationRequest request) {
        Bookshelf bookshelf = bookshelfRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bookshelf", id));
        bookshelf.setName(request.name());
        bookshelf = bookshelfRepository.save(bookshelf);
        return LocationResponse.fromBookshelf(bookshelf);
    }

    public void deleteBookshelf(Long id) {
        if (shelfRepository.hasBooksByBookshelfId(id)) {
            throw new BusinessException("Cannot delete bookshelf: contains books");
        }
        bookshelfRepository.deleteById(id);
    }

    public List<LocationResponse> getShelvesByBookshelf(Long bookshelfId) {
        return shelfRepository.findByBookshelfId(bookshelfId)
                .stream()
                .map(LocationResponse::fromShelf)
                .toList();
    }

    public LocationResponse createShelf(Long bookshelfId, LocationRequest request) {
        bookshelfRepository.findById(bookshelfId)
                .orElseThrow(() -> new ResourceNotFoundException("Bookshelf", bookshelfId));
        Shelf shelf = new Shelf();
        shelf.setName(request.name());
        shelf.setBookshelfId(bookshelfId);
        shelf = shelfRepository.save(shelf);
        return LocationResponse.fromShelf(shelf);
    }

    public LocationResponse updateShelf(Long id, LocationRequest request) {
        Shelf shelf = shelfRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shelf", id));
        shelf.setName(request.name());
        shelf = shelfRepository.save(shelf);
        return LocationResponse.fromShelf(shelf);
    }

    public void deleteShelf(Long id) {
        if (shelfRepository.hasBooks(id)) {
            throw new BusinessException("Cannot delete shelf: contains books");
        }
        shelfRepository.deleteById(id);
    }

    public LocationResponse assignLibrarianToHall(Long hallId, AssignLibrarianRequest request) {
        ensureLibrarianExists(request.librarianUserId());
        Hall hall = hallRepository.findById(hallId)
                .orElseThrow(() -> new ResourceNotFoundException("Hall", hallId));
        hall.setLibrarianUserId(request.librarianUserId());
        hall = hallRepository.save(hall);
        return LocationResponse.fromHall(hall);
    }

    public LocationResponse assignLibrarianToBookshelf(Long bookshelfId, AssignLibrarianRequest request) {
        ensureLibrarianExists(request.librarianUserId());
        Bookshelf bookshelf = bookshelfRepository.findById(bookshelfId)
                .orElseThrow(() -> new ResourceNotFoundException("Bookshelf", bookshelfId));
        bookshelf.setLibrarianUserId(request.librarianUserId());
        bookshelf = bookshelfRepository.save(bookshelf);
        return LocationResponse.fromBookshelf(bookshelf);
    }

    public LocationResponse assignLibrarianToShelf(Long shelfId, AssignLibrarianRequest request) {
        ensureLibrarianExists(request.librarianUserId());
        Shelf shelf = shelfRepository.findById(shelfId)
                .orElseThrow(() -> new ResourceNotFoundException("Shelf", shelfId));
        shelf.setLibrarianUserId(request.librarianUserId());
        shelf = shelfRepository.save(shelf);
        return LocationResponse.fromShelf(shelf);
    }

    public List<LocationResponse> getLocationsForLibrarian(Long userId) {
        List<LocationResponse> locations = new ArrayList<>();
        hallRepository.findByLibrarianUserId(userId)
                .stream()
                .map(LocationResponse::fromHall)
                .forEach(locations::add);
        bookshelfRepository.findByLibrarianUserId(userId)
                .stream()
                .map(LocationResponse::fromBookshelf)
                .forEach(locations::add);
        shelfRepository.findByLibrarianUserId(userId)
                .stream()
                .map(LocationResponse::fromShelf)
                .forEach(locations::add);
        return locations;
    }

    private void ensureLibrarianExists(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }
}
