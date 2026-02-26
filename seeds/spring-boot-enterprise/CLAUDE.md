# Spring Boot Enterprise — Claude Code 개발 규칙

## 프로젝트 개요

Java Spring Boot + MyBatis + Thymeleaf 기반 엔터프라이즈 백엔드 프로젝트.

## 기술 스택

- **백엔드**: Java 17+, Spring Boot 3.x
- **ORM**: MyBatis (XML 매퍼 방식)
- **템플릿**: Thymeleaf
- **빌드**: Gradle (Kotlin DSL)
- **DB**: MySQL / PostgreSQL
- **테스트**: JUnit 5, Mockito

## 패키지 구조

```
src/main/java/com/{company}/{project}/
├── controller/     # @RestController, @Controller
├── service/        # @Service, 비즈니스 로직
├── repository/     # @Repository, MyBatis Mapper 인터페이스
├── domain/         # Entity, VO, DTO
├── config/         # 설정 클래스
└── common/         # 공통 유틸, 예외 처리
```

## 코딩 컨벤션

- 클래스명: PascalCase (예: `UserService`, `OrderRepository`)
- 메서드명: camelCase (예: `findUserById`, `createOrder`)
- 상수: UPPER_SNAKE_CASE (예: `MAX_PAGE_SIZE`)
- DTO 클래스명: `{Entity}RequestDto`, `{Entity}ResponseDto`
- 레이어 의존 방향: Controller → Service → Repository (역방향 금지)
- `@Transactional`은 Service 레이어에서만 사용
- 모든 public 메서드에 Javadoc 작성

## 예외 처리 원칙

- `@ControllerAdvice`로 전역 예외 처리
- 비즈니스 예외는 `RuntimeException` 상속 커스텀 예외 사용
- HTTP 상태 코드와 에러 응답 형식 통일

```java
// 표준 에러 응답
{
  "code": "USER_NOT_FOUND",
  "message": "사용자를 찾을 수 없습니다.",
  "timestamp": "2026-02-26T10:00:00"
}
```

## MyBatis 규칙

- Mapper 인터페이스: `{Entity}Mapper.java`
- XML 매퍼: `resources/mapper/{Entity}Mapper.xml`
- resultMap 필수 사용 (자동 매핑 의존 금지)
- 동적 SQL은 XML `<if>`, `<choose>`, `<foreach>` 사용

## 테스트 원칙

- 서비스 레이어 단위 테스트 필수 (Mockito)
- 통합 테스트: `@SpringBootTest` + TestContainers
- 테스트 메서드명: `should_{결과}_{조건}` (예: `should_throwException_when_userNotFound`)
