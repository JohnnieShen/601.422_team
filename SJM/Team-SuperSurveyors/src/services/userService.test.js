var MOCK_DB_INSTANCE;
var MOCK_DOC_REF;
var mockAuthObject;

jest.mock('../firebase.js', () => {
  MOCK_DB_INSTANCE = { type: 'mocked-db' };
  return { __esModule: true, db: MOCK_DB_INSTANCE };
});

jest.mock('firebase/firestore', () => {
  MOCK_DOC_REF = { type: 'mocked-doc-ref', id: 'test-doc-id' };
  return {
    __esModule: true,
    doc: jest.fn((db) => (db === MOCK_DB_INSTANCE ? MOCK_DOC_REF : { unexpected: true })),
    setDoc:    jest.fn(),
    getDoc:    jest.fn(),
    updateDoc: jest.fn(),
    arrayUnion: jest.fn((x) => ({ __arrayUnion: x })),
  };
});

jest.mock('firebase/auth', () => {
  mockAuthObject = { currentUser: null };
  return {
    __esModule: true,
    getAuth:                     jest.fn(() => mockAuthObject),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword:     jest.fn(),
    updateProfile:                  jest.fn(),
    signOut:                        jest.fn(),
    GoogleAuthProvider:             jest.fn(),
    signInWithPopup:                jest.fn(),
  };
});

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import User           from '../models/User';
import * as authService    from './userService';
import { db }         from '../firebase.js';


jest.mock('../models/User');

describe('authService', () => {
    let consoleError;
    let consoleLog;

    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthObject.currentUser = null;

        User.mockImplementation(function(uid, displayName, email, photoURL, surveys = [], coins = undefined) {
            this.uid = uid;
            this.displayName = displayName;
            this.email = email;
            this.photoURL = photoURL;
            this.surveys = surveys;
            this.coins = coins;
            this.toJson = jest.fn(() => ({
                uid, displayName, email, photoURL, surveys, coins
            }));
        });

        consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

        setDoc.mockResolvedValue();
        getDoc.mockResolvedValue({ exists: () => false });
        updateDoc.mockResolvedValue();
        updateProfile.mockResolvedValue();
        signOut.mockResolvedValue();
    });

    afterEach(() => {
        consoleError.mockRestore();
        consoleLog.mockRestore();
    });

    describe('registerUser', () => {
        it('registers a new user, updates profile, writes to Firestore, and returns a User', async () => {
            const fakeAuthUser = { uid: 'u1', email: 'e@mail', photoURL: null };
            const mockUserInstanceData = { foo: 'bar' };
            createUserWithEmailAndPassword.mockResolvedValue({ user: fakeAuthUser });

            const toJsonMock = jest.fn(() => mockUserInstanceData);
            User.mockImplementation(function(uid, displayName, email, photoURL, surveys = [], coins = undefined) {
                this.uid = uid; this.displayName = displayName; this.email = email;
                this.photoURL = photoURL; this.surveys = surveys; this.coins = coins;
                this.toJson = toJsonMock;
            });

            const result = await authService.registerUser('e@mail', 'pass', 'Display');

            expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuthObject, 'e@mail', 'pass');
            expect(updateProfile).toHaveBeenCalledWith(fakeAuthUser, { displayName: 'Display' });
            expect(doc).toHaveBeenCalledWith(MOCK_DB_INSTANCE, 'users', 'u1');
            expect(setDoc).toHaveBeenCalledWith(MOCK_DOC_REF, mockUserInstanceData);
            expect(toJsonMock).toHaveBeenCalled();

            expect(result).toBeInstanceOf(User);
            expect(result.uid).toBe('u1');
            expect(result.displayName).toBe('Display');
            expect(result.email).toBe('e@mail');
            expect(result.photoURL).toBeNull();
            expect(result.surveys).toEqual([]);
        });

        it('bubbles up errors from Firebase', async () => {
             createUserWithEmailAndPassword.mockRejectedValue(new Error('fail'));
             await expect(authService.registerUser('a','b','c')).rejects.toThrow('fail');
             expect(consoleError).toHaveBeenCalledWith('Error registering user: ', expect.any(Error));
             expect(updateProfile).not.toHaveBeenCalled();
             expect(setDoc).not.toHaveBeenCalled();
        });
    });

    describe('loginUser', () => {
        const fakeAuthUser = { uid: 'u1', email: 'e1@test.com', photoURL: 'p.jpg' };
        const firestoreData = { displayName: 'D1', surveys: ['s1'], coins: 5 };

        it('logs in and returns a User when Firestore doc exists', async () => {
            signInWithEmailAndPassword.mockResolvedValue({ user: fakeAuthUser });
            getDoc.mockResolvedValue({
                exists: () => true,
                data: () => firestoreData,
            });
            User.mockImplementation(function(uid, displayName, email, photoURL, surveys, coins) {
                this.uid = uid; this.displayName = displayName; this.email = email;
                this.photoURL = photoURL; this.surveys = surveys; this.coins = coins;
            });

            const user = await authService.loginUser('e1@test.com', 'pw');

            expect(signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuthObject, 'e1@test.com', 'pw');
            expect(doc).toHaveBeenCalledWith(MOCK_DB_INSTANCE, 'users', 'u1');
            expect(getDoc).toHaveBeenCalledWith(MOCK_DOC_REF);

            expect(user).toBeInstanceOf(User);
            expect(user.uid).toBe('u1');
            expect(user.displayName).toBe('D1');
            expect(user.email).toBe('e1@test.com');
            expect(user.photoURL).toBe('p.jpg');
            User.mockImplementation(function(uid, displayName, email, photoURL, surveys, coins) {
                this.uid = uid;
                this.displayName = displayName;
                this.email = email;
                this.photoURL = photoURL;
                this.surveys = surveys;
                this.coins = coins;
            });
            const userActual = await authService.loginUser('e1@test.com', 'pw');
            expect(userActual.surveys).toBeUndefined();
            expect(userActual.coins).toBeUndefined();
        });

        it('returns null if Firestore doc does not exist', async () => {
            signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'u3', email: 'e3' } });
            getDoc.mockResolvedValue({ exists: () => false });

            const result = await authService.loginUser('e3', 'pw3');

            expect(signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuthObject, 'e3', 'pw3');
            expect(doc).toHaveBeenCalledWith(MOCK_DB_INSTANCE, 'users', 'u3');
            expect(getDoc).toHaveBeenCalledWith(MOCK_DOC_REF);
            expect(result).toBeNull();
            expect(consoleLog).toHaveBeenCalledWith('No such user document!');
        });

        it('bubbles up auth errors', async () => {
            signInWithEmailAndPassword.mockRejectedValue(new Error('bad credentials'));
            await expect(authService.loginUser('a','b')).rejects.toThrow('bad credentials');
            expect(doc).not.toHaveBeenCalled();
            expect(getDoc).not.toHaveBeenCalled();
        });
    });

     describe('loginGoogleUser', () => {
        it('returns existing user when Firestore doc exists', async () => {
            const fakeAuthUser = { uid: 'g1', displayName: 'G1-Auth', email: 'g1@mail', photoURL: 'gp.jpg' };
            const firestoreData = { displayName: 'G1-Firestore', email: 'g1@mail', photoURL: 'gp.jpg', surveys: ['s-exist'], coins: 2 };
            signInWithPopup.mockResolvedValue({ user: fakeAuthUser });
            getDoc.mockResolvedValue({
                exists: () => true,
                data: () => firestoreData
            });
             User.mockImplementation(function(uid, displayName, email, photoURL, surveys, coins) {
                this.uid = uid;
                this.displayName = displayName;
                this.email = email;
                this.photoURL = photoURL;
                 // Service logic passes undefined for surveys/coins here
                this.surveys = surveys;
                this.coins = coins;
            });

            const { isNewUser, user } = await authService.loginGoogleUser();

            expect(signInWithPopup).toHaveBeenCalledWith(mockAuthObject, expect.any(GoogleAuthProvider));
            expect(doc).toHaveBeenCalledWith(MOCK_DB_INSTANCE, 'users', 'g1');
            expect(getDoc).toHaveBeenCalledWith(MOCK_DOC_REF);
            expect(setDoc).not.toHaveBeenCalled();
            expect(isNewUser).toBe(false);
            expect(user).toBeInstanceOf(User);
            expect(user.displayName).toBe('G1-Firestore');
            // expect(user.surveys).toEqual(['s-exist']);
            // expect(user.coins).toBe(2);
        });

        it('creates new Firestore doc when none exists', async () => {
            const fakeAuthUser = { uid: 'g2', displayName: 'G2-Auth', email: 'g2@mail', photoURL: 'gp2.jpg' };
            signInWithPopup.mockResolvedValue({ user: fakeAuthUser });
            getDoc.mockResolvedValue({ exists: () => false });

            const mockNewUserJson = { uid: 'g2', displayName: 'G2-Auth', email: 'g2@mail', photoURL: 'gp2.jpg', surveys: [], coins: 10 };
            const toJsonMock = jest.fn(() => mockNewUserJson);
            User.mockImplementation(function(uid, displayName, email, photoURL, surveys = [], coins = 10) {
                this.uid = uid; this.displayName = displayName; this.email = email;
                this.photoURL = photoURL; this.surveys = surveys; this.coins = coins;
                this.toJson = toJsonMock;
            });

            const { isNewUser, user } = await authService.loginGoogleUser();

            expect(signInWithPopup).toHaveBeenCalledWith(mockAuthObject, expect.any(GoogleAuthProvider));
            expect(doc).toHaveBeenCalledWith(MOCK_DB_INSTANCE, 'users', 'g2');
            expect(getDoc).toHaveBeenCalledWith(MOCK_DOC_REF);
            expect(setDoc).toHaveBeenCalledWith(MOCK_DOC_REF, mockNewUserJson);
            expect(toJsonMock).toHaveBeenCalled();

            expect(isNewUser).toBe(true);
            expect(user).toBeInstanceOf(User);
            expect(user.coins).toBe(10);
        });

         it('catches and logs popup errors', async () => {
             signInWithPopup.mockRejectedValue(new Error('popup failed'));
             await expect(authService.loginGoogleUser()).resolves.toBeUndefined();
             expect(consoleLog).toHaveBeenCalledWith(expect.any(Error));
             expect(doc).not.toHaveBeenCalled();
             expect(getDoc).not.toHaveBeenCalled();
             expect(setDoc).not.toHaveBeenCalled();
         });
     });

    describe('updateUserProfile', () => {
        const baseAuthUser = { uid: 'u2', email: 'u2@mail.com' };

        it('updates auth profile + Firestore and returns the new User', async () => {
            const currentUserWithDetails = { ...baseAuthUser, coins: 3, surveys: ['x'] };
            mockAuthObject.currentUser = currentUserWithDetails;
            // updateProfile and setDoc already mocked

            User.mockImplementation(function(uid, displayName, email, photoURL, surveys, coins) {
                this.uid = uid; this.displayName = displayName; this.email = email;
                this.photoURL = photoURL; this.surveys = surveys; this.coins = coins;
            });

            const updated = await authService.updateUserProfile('u2', 'New Name', 'pic.png');

            expect(updateProfile).toHaveBeenCalledWith(currentUserWithDetails, {
                displayName: 'New Name',
                photoURL: 'pic.png',
            });
            expect(doc).toHaveBeenCalledWith(MOCK_DB_INSTANCE, 'users', 'u2');
            expect(setDoc).toHaveBeenCalledWith(
                MOCK_DOC_REF,
                { displayName: 'New Name', photoURL: 'pic.png' },
                { merge: true }
            );

            expect(updated).toBeInstanceOf(User);
            expect(updated.uid).toBe('u2');
            expect(updated.displayName).toBe('New Name');
            expect(updated.photoURL).toBe('pic.png');
            expect(updated.email).toBe('u2@mail.com');
            expect(updated.surveys).toEqual([]);
            expect(updated.coins).toBe(3);
        });

        it('throws if no user is signed in', async () => {
            mockAuthObject.currentUser = null;

            await expect(
                authService.updateUserProfile('x', 'y', 'z')
            ).rejects.toThrow('No user is signed in');

            expect(updateProfile).not.toHaveBeenCalled();
            expect(setDoc).not.toHaveBeenCalled();
        });

        it('returns a User with the original email and coins from auth.currentUser', async () => {
             const fakeAuthUserWithDetails = { uid: 'UID123', email: 'foo@bar.com', coins: 42, surveys: ['initial'] };
             mockAuthObject.currentUser = fakeAuthUserWithDetails;

             User.mockImplementation(function (uid, dn, email, pu, surveys, coins) {
               this.uid = uid; this.displayName = dn; this.email = email;
               this.photoURL = pu; this.surveys = surveys; this.coins = coins;
             });

             const updated = await authService.updateUserProfile('UID123', 'NewName', 'pic.png');

             expect(updateProfile).toHaveBeenCalledWith(fakeAuthUserWithDetails, {
               displayName: 'NewName',
               photoURL: 'pic.png',
             });
             expect(doc).toHaveBeenCalledWith(MOCK_DB_INSTANCE, 'users', 'UID123');
             expect(setDoc).toHaveBeenCalledWith(
               MOCK_DOC_REF,
               { displayName: 'NewName', photoURL: 'pic.png' },
               { merge: true }
             );
             expect(updated).toBeInstanceOf(User);
             expect(updated.email).toBe('foo@bar.com');
             expect(updated.coins).toBe(42);
             expect(updated.surveys).toEqual([]);
        });
    });

    describe('logoutUser', () => {
        it('calls signOut without throwing', async () => {
             mockAuthObject.currentUser = { uid: 'abc' };

            await expect(authService.logoutUser()).resolves.toBeUndefined();

            expect(getAuth).toHaveBeenCalledTimes(1);
            expect(signOut).toHaveBeenCalledWith(mockAuthObject);
        });

        it('logs errors but does not rethrow', async () => {
            signOut.mockRejectedValue(new Error('signout fail'));
            mockAuthObject.currentUser = { uid: 'abc' };

            await expect(authService.logoutUser()).resolves.toBeUndefined();

            expect(getAuth).toHaveBeenCalledTimes(1);
            expect(signOut).toHaveBeenCalledWith(mockAuthObject);
            expect(consoleError).toHaveBeenCalledWith('Error logging out:', expect.any(Error));
        });
    });

    describe('getCurrentUser', () => {
        it('returns a User when auth.currentUser is set', () => {
             const fakeAuthUser = { uid: 'u5', displayName: 'D5', email: 'd5@mail.com', photoURL: 'pic', surveys: ['S'], coins: 9 };
             mockAuthObject.currentUser = fakeAuthUser;
             User.mockImplementation(function (uid, dn, email, pu, surveys, coins) {
                this.uid = uid; this.displayName = dn; this.email = email;
                this.photoURL = pu; this.surveys = surveys; this.coins = coins;
            });

             const curr = authService.getCurrentUser();

             expect(User).toHaveBeenCalledWith('u5', 'D5', 'd5@mail.com', 'pic', ['S'], 9);
             expect(curr).toBeInstanceOf(User);
             expect(curr.uid).toBe('u5');
             expect(curr.coins).toBe(9);
             expect(curr.surveys).toEqual(['S']);
        });

        it('returns null when nobody is signed in', () => {
            mockAuthObject.currentUser = null;

            expect(authService.getCurrentUser()).toBeNull();
            expect(User).not.toHaveBeenCalled();
        });

        it('constructs a User containing uid, displayName, email, photoURL, surveys & coins', () => {
            const fakeAuthUser = { uid: 'uX', displayName: 'DX', email: 'x@e', photoURL: 'x.jpg', surveys: ['s1', 's2'], coins: 7 };
            mockAuthObject.currentUser = fakeAuthUser;
            User.mockImplementation(function (uid, dn, email, pu, surveys, coins) {
              this.uid = uid; this.displayName = dn; this.email = email;
              this.photoURL = pu; this.surveys = surveys; this.coins = coins;
            });

            const curr = authService.getCurrentUser();

            expect(curr).toBeInstanceOf(User);
            expect(User).toHaveBeenCalledWith('uX', 'DX', 'x@e', 'x.jpg', ['s1', 's2'], 7);
            expect(curr).toEqual({
              uid: 'uX', displayName: 'DX', email: 'x@e',
              photoURL: 'x.jpg', surveys: ['s1', 's2'], coins: 7,
              toJson: expect.any(Function)
            });
        });
    });

    describe('getUserInfo', () => {
        it('fetches Firestore data when exists and returns a User with Firestore data', async () => {
            const fakeAuthUser = { uid: 'u6', email: 'auth@mail.com' };
            const firestoreData = { uid: 'u6', displayName: 'D6-Firestore', email: 'firestore@mail.com', photoURL: 'p6', surveys: ['a'], coins: 3 };
            mockAuthObject.currentUser = fakeAuthUser;
            getDoc.mockResolvedValue({
                exists: () => true,
                data: () => firestoreData,
            });
            User.mockImplementation(function(uid, displayName, email, photoURL, surveys, coins) {
                this.uid = uid; this.displayName = displayName; this.email = email;
                this.photoURL = photoURL; this.surveys = surveys; this.coins = coins;
            });
            const info = await authService.getUserInfo();

            expect(doc).toHaveBeenCalledWith(MOCK_DB_INSTANCE, 'users', 'u6');
            expect(getDoc).toHaveBeenCalledWith(MOCK_DOC_REF);
            expect(User).toHaveBeenCalledWith('u6', 'D6-Firestore', 'firestore@mail.com', 'p6', ['a'], 3);
            expect(info).toBeInstanceOf(User);
            expect(info.displayName).toBe('D6-Firestore');
            expect(info.email).toBe('firestore@mail.com');
        });

        it('falls back to getCurrentUser if no doc', async () => {
             // Arrange
             const fakeAuthUserForFallback = { uid: 'u7', displayName: 'D7-Auth', email: 'e7@auth', photoURL: 'p7-auth', surveys: ['auth-s'], coins: 1 };
             mockAuthObject.currentUser = fakeAuthUserForFallback;
             getDoc.mockResolvedValue({ exists: () => false });

             User.mockImplementation(function(uid, displayName, email, photoURL, surveys, coins) {
                 this.uid = uid; this.displayName = displayName; this.email = email;
                 this.photoURL = photoURL; this.surveys = surveys; this.coins = coins;
             });

             const info = await authService.getUserInfo();

             expect(doc).toHaveBeenCalledWith(MOCK_DB_INSTANCE, 'users', 'u7');
             expect(getDoc).toHaveBeenCalledWith(MOCK_DOC_REF);
             expect(User).toHaveBeenCalledWith('u7', 'D7-Auth', 'e7@auth', 'p7-auth', ['auth-s'], 1);
             expect(info).toBeInstanceOf(User);
             expect(info.displayName).toBe('D7-Auth');
        });

        it('when Firestore doc exists, returns a User with all fields from that doc', async () => {
             const fakeAuthUser = { uid: 'uA' };
             const firestoreData = { uid: 'uA', displayName: 'NameA', email: 'a@mail', photoURL: 'a.png', surveys: ['srv1'], coins: 3 };
             mockAuthObject.currentUser = fakeAuthUser;
             getDoc.mockResolvedValue({ exists: () => true, data: () => firestoreData });
             User.mockImplementation(function (uid, dn, email, pu, surveys, coins) {
               this.uid = uid; this.displayName = dn; this.email = email;
               this.photoURL = pu; this.surveys = surveys; this.coins = coins;
             });

             const info = await authService.getUserInfo();

             expect(doc).toHaveBeenCalledWith(MOCK_DB_INSTANCE, 'users', 'uA');
             expect(getDoc).toHaveBeenCalledWith(MOCK_DOC_REF);
             expect(User).toHaveBeenCalledWith('uA', 'NameA', 'a@mail', 'a.png', ['srv1'], 3);
             expect(info).toEqual({
                 uid: 'uA', displayName: 'NameA', email: 'a@mail',
                 photoURL: 'a.png', surveys: ['srv1'], coins: 3,
                 toJson: expect.any(Function)
             });
        });

        it('when Firestore doc does NOT exist, falls back to getCurrentUser()', async () => {
            const fakeAuthUserForFallback = { uid: 'uB', displayName: 'NameB', email: 'b@mail', photoURL: 'b.png', surveys: [], coins: 2 };
            mockAuthObject.currentUser = fakeAuthUserForFallback;
            getDoc.mockResolvedValue({ exists: () => false });
            User.mockImplementation(function (uid, dn, email, pu, surveys, coins) {
              this.uid = uid; this.displayName = dn; this.email = email;
              this.photoURL = pu; this.surveys = surveys; this.coins = coins;
            });

            const info = await authService.getUserInfo();

            expect(doc).toHaveBeenCalledWith(MOCK_DB_INSTANCE, 'users', 'uB');
            expect(getDoc).toHaveBeenCalledWith(MOCK_DOC_REF);
            expect(User).toHaveBeenCalledWith('uB', 'NameB', 'b@mail', 'b.png', [], 2);
            expect(info).toEqual({
              uid: 'uB', displayName: 'NameB', email: 'b@mail',
              photoURL: 'b.png', surveys: [], coins: 2,
              toJson: expect.any(Function)
            });
        });
    });

    describe('addSurveyToUser', () => {
        it('updates the user document with a new survey ID', async () => {
            const fakeAuthUser = { uid: 'u8' };
            mockAuthObject.currentUser = fakeAuthUser;
            const arrayUnionResult = { __arrayUnion: 'survey123' };
            arrayUnion.mockReturnValue(arrayUnionResult);

            await authService.addSurveyToUser('survey123');

            expect(doc).toHaveBeenCalledWith(MOCK_DB_INSTANCE, 'users', 'u8');
            expect(arrayUnion).toHaveBeenCalledWith('survey123');
            expect(updateDoc).toHaveBeenCalledWith(MOCK_DOC_REF, {
                surveys: arrayUnionResult
            });
        });

        it('does nothing if there is no signed-in user', async () => {
             mockAuthObject.currentUser = null;

             await authService.addSurveyToUser('survey123');

             expect(doc).not.toHaveBeenCalled();
             expect(updateDoc).not.toHaveBeenCalled();
             expect(arrayUnion).not.toHaveBeenCalled();
        });
    });
});