export default function RightSidebar() {
    return (
      <aside className="w-64 p-4 border-l bg-gray-100 flex flex-col h-screen overflow-hidden">
        <div className="h-[40%] border-b pb-2 flex flex-col">
          <h3 className="text-md font-semibold mb-1">Gametree</h3>
          <div className="bg-white rounded p-2 shadow-inner overflow-auto flex-grow">
            Gametree 기능이 구현될 부분
          </div>
        </div>

        <div className="h-[20%] border-b pb-2 flex flex-col">
          <h3 className="text-md font-semibold mb-1">Boardmatcher</h3>
          <div className="bg-white rounded p-2 shadow-inner overflow-auto flex-grow">
            Boardmatcher 기능이 구현될 부분
          </div>
        </div>

        <div className="h-[40%] flex flex-col">
          <h3 className="text-md font-semibold mb-1">AI Comment</h3>
          <div className="bg-white rounded p-2 shadow-inner flex flex-col overflow-auto flex-grow">
            <div className="mb-2">AIcomment 기능이 구현될 부분</div>
            <input
              type="text"
              className="border rounded px-2 py-1"
              placeholder="AI에게 질문하세요..."
            />
          </div>
        </div>
      </aside>
    );
  }