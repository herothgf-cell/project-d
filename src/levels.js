/* Designer-selected boards. Difficulty labels are provisional until playtesting. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BodyShareLevels=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const data=[
{
 id:1,
 title:"한 조각씩",
 tag:"교환",
 difficulty:"입문",
 rows:["#######","#.....#","#.....#","#.....#","#######"],
 red:[[2,1],[1,1],[1,2]],
 blue:[[4,3],[5,3],[5,2]],
 homes:[[3,1],[3,3]],
 hints:["빨강을 움직일 때, 파랑 꼬리를 보세요.","빨강은 오른쪽, 파랑은 왼쪽으로 한 칸씩 가면 돼요."],
 optimal:2,
 solution:"0R 1L",
 trap:"0R 0R 1U 1R 1U"
},
{
 id:2,
 title:"네가 열어주는 길",
 tag:"꼬리 지우기",
 difficulty:"입문",
 rows:["#######","##...##","##..###","###...#","#######"],
 red:[[3,2],[2,2],[2,1],[3,1]],
 blue:[[4,3],[3,3]],
 homes:[[4,1],[5,3]],
 hints:["빨강 얼굴 위의 칸은 빨강의 꼬리예요.","파랑을 오른쪽으로 움직여 그 꼬리를 없앤 뒤, 빨강을 위로 보내세요."],
 optimal:3,
 solution:"1R 0U 0R",
 trap:""
},
{
 id:3,
 title:"머리만 남았네",
 tag:"돌려주기",
 difficulty:"입문",
 rows:["#######","#.....#","#.###.#","#.....#","#######"],
 red:[[2,1],[1,1],[1,2]],
 blue:[[4,3],[3,3],[2,3]],
 homes:[[5,2],[2,3]],
 hints:["상대가 한 칸이면 더 빌릴 수 없어요.","빨강이 오른쪽으로 두 번 간 뒤, 파랑을 왼쪽으로 움직여 몸을 돌려주세요."],
 optimal:6,
 solution:"0R 0R 1L 0R 1L 0D",
 trap:"0R 0R 1R 0R 1U"
},
{
 id:4,
 title:"어느 쪽부터?",
 tag:"이동 순서",
 difficulty:"기초",
 rows:["#######","#.....#","#.##..#","#.....#","#######"],
 red:[[2,1],[1,1],[1,2]],
 blue:[[4,3],[5,3],[5,2]],
 homes:[[4,2],[5,1]],
 hints:["오른쪽 길로 가려면 파랑 꼬리가 비켜야 해요.","빨강을 오른쪽으로 두 번 보낸 뒤 파랑을 오른쪽으로 늘려보세요. 빨강은 아래로, 파랑은 위로 올라가요."],
 optimal:6,
 solution:"0R 0R 1R 0D 1U 1U",
 trap:"0R 0R 1U 1R 1U"
},
{
 id:5,
 title:"한 조각 더 기다려",
 tag:"꼬리 순서",
 difficulty:"기초",
 rows:["######","#....#","#.#..#","#....#","#..#.#","######"],
 red:[[2,1],[1,1],[1,2]],
 blue:[[3,3],[4,3],[4,4]],
 homes:[[1,3],[2,1]],
 hints:["빨강은 왼쪽으로 가고 싶지만 자기 몸이 막고 있어요.","파랑을 위, 오른쪽으로 먼저 움직이세요. 빨강이 왼쪽 길로 내려갈 수 있어요."],
 optimal:8,
 solution:"1U 1R 0L 0D 0D 1U 1L 1L",
 trap:"0R 0R 1R 1U 1L"
},
{
 id:6,
 title:"작은 막다른 길",
 tag:"공간 남기기",
 difficulty:"기초",
 rows:["#######","#.....#","#.###.#","#.....#","#..#..#","#######"],
 red:[[2,1],[1,1],[1,2]],
 blue:[[3,3],[4,3],[5,3]],
 homes:[[5,3],[5,4]],
 hints:["두 집 모두 오른쪽에 있지만, 같은 길만 고집하지 않아도 돼요.","빨강을 위쪽 길로 보내고 파랑은 오른쪽 아래 작은 공간으로 돌아가세요. 서로 길이를 돌려주는 순서를 보세요."],
 optimal:8,
 solution:"0R 0R 1R 0R 1D 0D 1R 0D",
 trap:"0R 0R 1R 0R 1R 1U"
},
{
 id:7,
 title:"네가 움직일 자리",
 tag:"자리 교환",
 difficulty:"응용",
 rows:["#######","#....##","#.#...#","#...#.#","##....#","#######"],
 red:[[2,1],[1,1],[1,2]],
 blue:[[4,4],[5,4],[5,3]],
 homes:[[5,4],[3,3]],
 hints:["빨강 집에 가려면 파랑이 오른쪽 아래를 비워줘야 해요.","빨강을 오른쪽으로 두 번 보낸 뒤 파랑을 오른쪽으로 늘리세요. 빨강이 내려오는 동안 파랑은 왼쪽 공간으로 돌아가요."],
 optimal:10,
 solution:"0R 0R 1R 0D 1L 0R 1L 0D 1U 0D",
 trap:"0R 0D 1R 0R 1U 0U 1U"
},
{
 id:8,
 title:"빌렸다가 돌려주기",
 tag:"길이 배분",
 difficulty:"응용",
 rows:["#######","#.....#","#..#..#","##...##","#..#..#","#.....#","#######"],
 red:[[2,1],[1,1],[1,2],[2,2]],
 blue:[[4,5],[5,5],[5,4],[4,4]],
 homes:[[3,3],[3,1]],
 hints:["가운데 통로에 들어가기 전, 상대가 길어질 자리를 남겨두세요.","빨강은 위쪽 오른편에서 가운데로, 파랑은 아래쪽 왼편에서 위로 올라가게 해보세요."],
 optimal:12,
 solution:"0R 0R 0D 1L 0D 1L 0L 1U 1U 1U 1U 1R",
 trap:"0R 0R 0R 1U 0D 1U 1U"
},
{
 id:9,
 title:"먼저 멀어지기",
 tag:"우회와 복귀",
 difficulty:"응용",
 rows:["######","#....#","#.#..#","#....#","#..#.#","######"],
 red:[[2,1],[1,1],[1,2]],
 blue:[[3,3],[4,3],[4,4]],
 homes:[[1,1],[3,2]],
 hints:["빨강의 집은 바로 왼쪽이지만, 몸을 지울 준비가 필요해요.","빨강을 먼저 오른쪽으로 늘리세요. 파랑이 왼쪽 아래 작은 공간을 돌아가는 동안 빨강이 돌아올 길이 생겨요."],
 optimal:12,
 solution:"0R 0R 1L 1D 1L 1U 0L 0L 0L 1R 1R 1U",
 trap:"0R 0R 1R 1U 1L"
},
{
 id:10,
 title:"집에서도 한 걸음",
 tag:"집에서 나오기",
 difficulty:"도전",
 rows:["#######","#.....#","#.###.#","#.....#","#######"],
 red:[[2,1],[1,1],[1,2]],
 blue:[[2,3],[3,3],[4,3]],
 homes:[[2,1],[5,1]],
 hints:["빨강은 집에 있어도 움직일 수 있어요.","빨강이 오른쪽으로 나와 몸을 빌려주세요. 파랑이 오른쪽 길로 올라오는 동안 빨강 꼬리가 줄어 돌아갈 수 있어요."],
 optimal:9,
 solution:"0R 0R 1R 1R 1R 1U 0L 0L 1U",
 trap:"1L 1U 0L"
},
{
 id:11,
 title:"들어갈 순서",
 tag:"길 나누기",
 difficulty:"도전",
 rows:["#######","#.....#","#.#.#.#","#.....#","#.#.#.#","#.....#","#######"],
 red:[[2,1],[1,1],[1,2],[1,3]],
 blue:[[4,5],[5,5],[5,4],[5,3]],
 homes:[[4,5],[2,5]],
 hints:["두 집은 아래쪽에 있어요. 빨강이 내려갈 길을 먼저 확보하세요.","빨강은 오른쪽 바깥 길로, 파랑은 왼쪽 아래로 돌아가요. 집 가까이에서 한쪽이 한 칸 더 비켜줄 자리를 생각하세요."],
 optimal:14,
 solution:"0R 0R 0R 1R 0D 1L 0D 1L 0D 1U 0D 1D 0L 1L",
 trap:"0R 0R 0R 1R 1U 1U 1U"
},
{
 id:12,
 title:"꼬리를 기다려",
 tag:"종합",
 difficulty:"도전",
 rows:["#######","#.....#","#..#..#","#.....#","#..#..#","#.....#","#######"],
 red:[[2,1],[1,1],[1,2],[1,3]],
 blue:[[4,5],[5,5],[5,4],[5,3]],
 homes:[[5,3],[5,1]],
 hints:["빨강이 집에 도착해도, 그 몸이 파랑 길을 막을 수 있어요.","빨강을 집보다 한 칸 더 아래로 보내세요. 파랑이 가운데에서 왼쪽을 돌아 위로 올라가는 동안 빨강이 돌아올 수 있어요."],
 optimal:16,
 solution:"0R 0R 0R 1U 0D 1U 0D 1L 0D 1L 1U 1U 1R 1R 1R 0U",
 trap:"0R 0R 0R 1U 1U 1R 1U 1L"
}
];
const path=s=>s?s.split(' ').map(a=>({actor:Number(a[0]),dir:a[1]})):[];
return data.map(l=>{
 const width=l.rows[0].length,cell=([x,y])=>y*width+x;
 const walls=l.rows.flatMap((r,y)=>[...r].flatMap((c,x)=>c==='#'?[y*width+x]:[]));
 return {...l,width,height:l.rows.length,walls,bodies:[l.red.map(cell),l.blue.map(cell)],goals:l.homes.map(cell),solution:path(l.solution),trap:path(l.trap)};
});
});
