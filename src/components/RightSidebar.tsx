export default function RightSidebar({
  comment,
  setComment,
  gameRef,
}: {
  comment: string;
  setComment: (value: string) => void;
  gameRef: React.RefObject<any>;
}) {
  return (
    <aside className="w-64 p-4 border-l bg-gray-100 flex flex-col min-h-screen">
      <div className="h-[44%] border-b pb-2 flex flex-col">
        <h3 className="text-md font-semibold mb-1">Gametree</h3>
        <div className="bg-white rounded p-2 shadow-inner overflow-auto flex-grow">
          Gametree 기능
        </div>
      </div>

      <div className="h-[12%] border-b pb-2 flex flex-col">
        <h3 className="text-md font-semibold mb-1">Boardmatcher</h3>
        <div className="bg-white rounded p-2 shadow-inner overflow-auto flex-grow">
          Boardmatcher 기능
        </div>
      </div>

      <div className="h-[44%] flex flex-col">
        <h3 className="text-md font-semibold mb-1">User Comment</h3>
        <div className="bg-white rounded p-2 shadow-inner flex flex-col overflow-auto flex-grow">
          <textarea
            className="border rounded px-2 py-1 h-full w-full resize-none"
            placeholder="메모 입력"
            value={comment}
            onChange={(e) => {
              const newComment = e.target.value;
              setComment(newComment);
              if (gameRef.current?.getGameState()) {
                gameRef.current.getGameState().comment = newComment;
              }
            }}
          />
        </div>
      </div>
    </aside>
  );
}