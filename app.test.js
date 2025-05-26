const request = require("supertest");
const app = require("./app");

// Test route get /games/game/:code
it("GET /games/game/wzoag", async () => {
  const res = await request(app).get("/games/game/wzoag");

  expect(res.statusCode).toBe(200);
  expect(res.body.game).toEqual({
    _id: "68341642703c35f29513e1a8",
    status: false,
    code: "wzoag",
    title: "Dragon",
    image:
      "https://res.cloudinary.com/dxgix5q4e/image/upload/v1747834157/dragon_xabusn.png",
    genre: "Aventure",
    nbPlayers: 4,
    nbScenes: 8,
    winner: "EZmsJzuRLhSyBhCGRhBt1juy7G7ylsuo",
    usersId: ["682d9a48b818070dd37cdd60"],
    __v: 0,
  });
});
