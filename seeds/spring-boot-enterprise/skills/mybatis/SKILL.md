---
name: mybatis
description: MyBatis 매퍼 작성 가이드 — XML 매퍼, 동적 SQL, resultMap
user-invocable: false
---

# MyBatis 매퍼 가이드

## 기본 구조

### Mapper 인터페이스
```java
@Mapper
public interface UserMapper {
    Optional<User> findById(Long id);
    List<User> findAll(UserSearchCondition condition);
    void insert(User user);
    int update(User user);
    int deleteById(Long id);
}
```

### XML 매퍼 파일 위치
```
src/main/resources/mapper/UserMapper.xml
```

## resultMap 설계 (필수)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.repository.UserMapper">

    <resultMap id="UserResultMap" type="com.example.domain.User">
        <id     property="id"        column="user_id"/>
        <result property="username"  column="username"/>
        <result property="email"     column="email"/>
        <result property="createdAt" column="created_at"/>
        <!-- 연관 객체 -->
        <association property="profile" javaType="UserProfile">
            <id     property="id"     column="profile_id"/>
            <result property="bio"    column="bio"/>
        </association>
        <!-- 컬렉션 -->
        <collection property="roles" ofType="Role">
            <id     property="id"   column="role_id"/>
            <result property="name" column="role_name"/>
        </collection>
    </resultMap>

    <select id="findById" parameterType="long" resultMap="UserResultMap">
        SELECT u.user_id, u.username, u.email, u.created_at,
               p.profile_id, p.bio,
               r.role_id, r.role_name
        FROM users u
        LEFT JOIN user_profiles p ON u.user_id = p.user_id
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.role_id
        WHERE u.user_id = #{id}
    </select>

</mapper>
```

**규칙**:
- resultMap 항상 명시 (자동 매핑 의존 금지 — 컬럼명 변경 시 버그 위험)
- PK 컬럼은 반드시 `<id>` 태그 사용 (캐싱 최적화)

## 동적 SQL

```xml
<select id="findAll" parameterType="UserSearchCondition" resultMap="UserResultMap">
    SELECT * FROM users
    <where>
        <if test="username != null and username != ''">
            AND username LIKE CONCAT('%', #{username}, '%')
        </if>
        <if test="email != null and email != ''">
            AND email = #{email}
        </if>
        <if test="createdAfter != null">
            AND created_at >= #{createdAfter}
        </if>
    </where>
    <choose>
        <when test="sortBy == 'createdAt'">ORDER BY created_at DESC</when>
        <when test="sortBy == 'username'">ORDER BY username ASC</when>
        <otherwise>ORDER BY user_id DESC</otherwise>
    </choose>
    LIMIT #{pageSize} OFFSET #{offset}
</select>

<!-- IN 절 -->
<select id="findByIds" resultMap="UserResultMap">
    SELECT * FROM users
    WHERE user_id IN
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>
```

## INSERT / UPDATE

```xml
<insert id="insert" parameterType="User" useGeneratedKeys="true" keyProperty="id">
    INSERT INTO users (username, email, created_at)
    VALUES (#{username}, #{email}, NOW())
</insert>

<update id="update" parameterType="User">
    UPDATE users
    <set>
        <if test="username != null">username = #{username},</if>
        <if test="email != null">email = #{email},</if>
        updated_at = NOW()
    </set>
    WHERE user_id = #{id}
</update>
```

## N+1 문제 방지

**나쁜 예** (N+1 발생):
```java
// Service에서 루프마다 쿼리 실행
List<User> users = userMapper.findAll();
users.forEach(u -> u.setOrders(orderMapper.findByUserId(u.getId()))); // N번 쿼리!
```

**좋은 예** (JOIN으로 한 번에):
```xml
<select id="findAllWithOrders" resultMap="UserWithOrdersResultMap">
    SELECT u.*, o.order_id, o.amount
    FROM users u
    LEFT JOIN orders o ON u.user_id = o.user_id
</select>
```

## 페이징

```java
// PageHelper 플러그인 사용 (권장)
PageHelper.startPage(pageNum, pageSize);
List<User> users = userMapper.findAll(condition);
PageInfo<User> pageInfo = new PageInfo<>(users);
```

또는 직접 LIMIT/OFFSET 사용:
```xml
LIMIT #{pageSize} OFFSET #{(pageNum - 1) * pageSize}
```
