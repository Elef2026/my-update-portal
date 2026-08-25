import SplitUpdateForm from "@/components/forms/SplitUpdateForm";

export default function NewOrderPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">አዲስ የሰነድ ማደሻ ጥያቄ (New Update Request)</h1>
          <p className="text-muted-foreground mt-2">
            የደንበኛውን የድሮ/የተሳሳተ መረጃ እና መስተካከል ያለበትን አዲስ/ትክክለኛ መረጃ ከታች ባለው ቅጽ ላይ በጥንቃቄ ያስገቡ።
          </p>
        </div>
        
        {/* Render the core form */}
        <SplitUpdateForm />
      </div>
    </div>
  );
}
