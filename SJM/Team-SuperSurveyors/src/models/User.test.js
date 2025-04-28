import User from './User';

describe('User model', () => {
  const uid = 'user123';
  const displayName = 'Alice';
  const email = 'alice@example.com';
  const photoURL = 'https://example.com/photo.png';
  const initialSurveys = ['s1', 's2'];
  const coins = 100;

  test('constructor sets all properties and defaults surveys to [] when omitted', () => {
    const u1 = new User(uid, displayName, email, photoURL, initialSurveys, coins);
    expect(u1.uid).toBe(uid);
    expect(u1.displayName).toBe(displayName);
    expect(u1.email).toBe(email);
    expect(u1.photoURL).toBe(photoURL);
    expect(u1.surveys).toEqual(initialSurveys);
    expect(u1.coins).toBe(coins);

    const u2 = new User(uid, displayName, email, photoURL);
    expect(u2.surveys).toEqual([]);
    expect(u2.coins).toBeUndefined();
  });

  test('updateProfile changes displayName and photoURL', () => {
    const u = new User(uid, displayName, email, photoURL, [], coins);
    u.updateProfile('Bob', 'https://example.com/bob.png');
    expect(u.displayName).toBe('Bob');
    expect(u.photoURL).toBe('https://example.com/bob.png');
  });

  test('addSurvey pushes a new survey ID', () => {
    const u = new User(uid, displayName, email, photoURL, ['s1'], coins);
    u.addSurvey('s3');
    expect(u.surveys).toContain('s3');
    expect(u.surveys).toEqual(['s1', 's3']);
  });

  test('toJson returns a plain object matching properties', () => {
    const surveys = ['a', 'b'];
    const u = new User(uid, displayName, email, photoURL, surveys, coins);
    const json = u.toJson();
    expect(json).toEqual({
      uid,
      displayName,
      email,
      photoURL,
      surveys,
      coins,
    });
    // mutating original surveys WILL affect the JSON (because we didn't clone it)
    surveys.push('c');
    expect(json.surveys).toEqual(['a', 'b', 'c']);
  });

  test('fromFirestore creates a User instance (coins undefined)', () => {
    const data = {
      uid: 'fs123',
      displayName: 'Carol',
      email: 'carol@example.com',
      photoURL: 'https://cdn.com/carol.jpg',
      surveys: ['x', 'y', 'z'],
    };
    const u = User.fromFirestore(data);
    expect(u).toBeInstanceOf(User);
    expect(u.uid).toBe(data.uid);
    expect(u.displayName).toBe(data.displayName);
    expect(u.email).toBe(data.email);
    expect(u.photoURL).toBe(data.photoURL);
    expect(u.surveys).toEqual(data.surveys);
    expect(u.coins).toBeUndefined();
  });
});
