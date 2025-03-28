export default function RightSidebar() {
    return (
      <aside className="w-64 p-4 border-l bg-gray-100 flex flex-col min-h-screen">
        <div className="h-[44%] border-b pb-2 flex flex-col">
          <h3 className="text-md font-semibold mb-1">Gametree</h3>
          <div className="bg-white rounded p-2 shadow-inner overflow-auto flex-grow">
            Gametree 기능이 구현될 부분
          </div>
        </div>

        <div className="h-[12%] border-b pb-2 flex flex-col">
          <h3 className="text-md font-semibold mb-1">Boardmatcher</h3>
          <div className="bg-white rounded p-2 shadow-inner overflow-auto flex-grow">
            Boardmatcher 기능
          </div>
        </div>

        <div className="h-[44%] flex flex-col">
          <h3 className="text-md font-semibold mb-1">AI Comment</h3>
          <div className="bg-white rounded p-2 shadow-inner flex flex-col overflow-auto flex-grow">
            <div className="mb-2">AIcomment 기능이 구현될 부분</div>
            <textarea
              className="border rounded px-2 py-1 h-full w-full resize-none"
              placeholder="AI 코멘트 불러올 영역, 사용자 수정도 가능"
            />
          </div>
        </div>
      </aside>
    );
  }