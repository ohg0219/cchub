---
name: spring-boot
description: Spring Boot 엔터프라이즈 아키텍처 및 패턴 가이드
user-invocable: false
---

# Spring Boot 아키텍처 가이드

## 레이어드 아키텍처

```
Client
  ↓
Controller (@RestController)
  ↓
Service (@Service)
  ↓
Repository (Mapper Interface)
  ↓
Database
```

**규칙**:
- 레이어 간 의존 방향은 위→아래만 허용 (역방향 금지)
- Controller는 요청 수신/응답 반환만 담당 (비즈니스 로직 금지)
- Service는 트랜잭션 경계 관리 및 비즈니스 로직 담당
- Repository는 데이터 접근만 담당

## Controller 작성 원칙

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponseDto> createUser(
            @Valid @RequestBody UserRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userService.create(request));
    }
}
```

**원칙**:
- `@Valid`로 입력 검증 필수
- `ResponseEntity`로 HTTP 상태 코드 명시
- URL은 복수형 명사 사용 (`/users`, `/orders`)
- 버전 관리: `/api/v1/...`

## Service 작성 원칙

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)  // 기본: 읽기 전용
public class UserService {

    private final UserMapper userMapper;

    public UserResponseDto findById(Long id) {
        User user = userMapper.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
        return UserResponseDto.from(user);
    }

    @Transactional  // 쓰기: 명시적으로 오버라이드
    public UserResponseDto create(UserRequestDto request) {
        User user = User.of(request);
        userMapper.insert(user);
        return UserResponseDto.from(user);
    }
}
```

**원칙**:
- 클래스 레벨 `@Transactional(readOnly = true)` 기본 설정
- 쓰기 메서드에만 `@Transactional` 명시
- 엔티티를 직접 반환하지 말고 DTO로 변환

## DTO 설계

```java
// Request DTO (입력)
public record UserRequestDto(
    @NotBlank String username,
    @Email String email,
    @Size(min = 8) String password
) {}

// Response DTO (출력)
public record UserResponseDto(
    Long id,
    String username,
    String email,
    LocalDateTime createdAt
) {
    public static UserResponseDto from(User user) {
        return new UserResponseDto(
            user.getId(), user.getUsername(),
            user.getEmail(), user.getCreatedAt()
        );
    }
}
```

## 전역 예외 처리

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(
            UserNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.of("USER_NOT_FOUND", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest()
            .body(ErrorResponse.of("VALIDATION_FAILED", message));
    }
}
```

## application.yml 관리

```yaml
spring:
  profiles:
    active: ${SPRING_PROFILE:local}

---
spring:
  config:
    activate:
      on-profile: local
  datasource:
    url: jdbc:mysql://localhost:3306/mydb

---
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: ${DATABASE_URL}
```

환경별 설정 분리: `application-local.yml`, `application-prod.yml`
