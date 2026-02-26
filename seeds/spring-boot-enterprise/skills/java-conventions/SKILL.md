---
name: java-conventions
description: Java 코딩 컨벤션 — 명명 규칙, Javadoc, 패키지 구조, 테스트
user-invocable: false
---

# Java 코딩 컨벤션

## 명명 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 클래스/인터페이스 | PascalCase | `UserService`, `OrderRepository` |
| 메서드/변수 | camelCase | `findUserById`, `totalAmount` |
| 상수 | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE`, `DEFAULT_TIMEOUT` |
| 패키지 | 소문자 | `com.example.service` |
| 제네릭 타입 | 단일 대문자 | `T`, `E`, `K`, `V` |

## 메서드 명명 패턴

```java
// 조회
User findById(Long id)           // 단건, Optional 반환 고려
List<User> findAll(Condition c)  // 목록
boolean existsByEmail(String email)  // 존재 여부
long countByStatus(Status status)    // 개수

// 변경
User create(UserRequestDto dto)  // 생성
User update(Long id, UpdateDto dto)  // 수정
void delete(Long id)             // 삭제
void activate(Long id)           // 상태 변경
```

## Javadoc 작성 규칙

```java
/**
 * 사용자 ID로 사용자를 조회합니다.
 *
 * @param id 조회할 사용자 ID
 * @return 사용자 정보
 * @throws UserNotFoundException 사용자가 존재하지 않는 경우
 */
public User findById(Long id) {
    return userMapper.findById(id)
        .orElseThrow(() -> new UserNotFoundException(id));
}
```

**작성 기준**:
- 모든 public 메서드에 Javadoc 필수
- `@param`, `@return`, `@throws` 태그 포함
- 한국어 작성 허용

## 패키지 구조

```
com.{company}.{project}/
├── {Project}Application.java    # 메인 클래스
├── controller/                  # HTTP 요청 처리
│   └── UserController.java
├── service/                     # 비즈니스 로직
│   ├── UserService.java
│   └── impl/                    # 인터페이스-구현 분리 시
│       └── UserServiceImpl.java
├── repository/                  # 데이터 접근
│   └── UserMapper.java
├── domain/                      # 엔티티, VO, DTO
│   ├── entity/
│   │   └── User.java
│   └── dto/
│       ├── request/
│       │   └── UserRequestDto.java
│       └── response/
│           └── UserResponseDto.java
├── config/                      # 설정
│   ├── WebConfig.java
│   └── MyBatisConfig.java
├── common/                      # 공통
│   ├── exception/
│   │   ├── BusinessException.java
│   │   └── UserNotFoundException.java
│   └── response/
│       └── ErrorResponse.java
└── util/                        # 유틸리티
```

## 불변 설계 원칙

```java
// Record 사용 (Java 16+) — DTO에 적합
public record UserResponseDto(Long id, String username, String email) {}

// 또는 Lombok @Value — 불변 클래스
@Value
public class Money {
    long amount;
    Currency currency;

    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("통화 불일치");
        }
        return new Money(this.amount + other.amount, this.currency);
    }
}
```

## 테스트 작성

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("존재하지 않는 ID로 조회 시 UserNotFoundException 발생")
    void should_throwException_when_userNotFound() {
        // given
        given(userMapper.findById(999L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userService.findById(999L))
            .isInstanceOf(UserNotFoundException.class)
            .hasMessageContaining("999");
    }
}
```

**규칙**:
- 메서드명 패턴: `should_{결과}_when_{조건}` 또는 `@DisplayName` 사용
- Given-When-Then 구조 명시
- 단위 테스트: Mock 사용, 외부 의존 차단
- 통합 테스트: `@SpringBootTest` + TestContainers

## Optional 사용

```java
// 올바른 사용
Optional<User> user = userMapper.findById(id);
return user.orElseThrow(() -> new UserNotFoundException(id));

// 잘못된 사용 (null 반환 가능성 있음)
User user = userMapper.findById(id).orElse(null); // 피할 것
if (user == null) { ... }                          // Optional 의미 없음

// Optional을 파라미터로 사용 금지
void process(Optional<User> user) { ... } // 금지
```
