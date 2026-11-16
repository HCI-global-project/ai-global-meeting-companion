from app.domain.models import MeetingOutcome, OutcomeItem
from app.services.outcome_merge import Operation, apply_operations, describe


def base() -> MeetingOutcome:
    return MeetingOutcome(
        decided=[OutcomeItem(id="d1", text="테스트 참가자는 5명", translations={"en": "Five participants"})],
        undecided=[OutcomeItem(id="u1", text="발표 날짜")],
    )


def test_add_creates_item_with_new_stable_id():
    updated, changed = apply_operations(base(), [Operation(op="add", bucket="actionItems", text="참가자 모집", owner="Kenji")])
    item = updated.action_items[0]
    assert item.id.startswith("o-") and item.owner == "Kenji"
    assert changed == {item.id}


def test_move_keeps_id_and_translations():
    updated, changed = apply_operations(base(), [Operation(op="move", id="u1", bucket="decided")])
    assert [i.id for i in updated.decided] == ["d1", "u1"]
    assert updated.undecided == []
    assert changed == set()


def test_update_text_clears_old_translations():
    updated, changed = apply_operations(base(), [Operation(op="update", id="d1", text="테스트 참가자는 6명")])
    assert updated.decided[0].text == "테스트 참가자는 6명"
    assert updated.decided[0].translations == {}
    assert changed == {"d1"}


def test_remove_and_invalid_ops_are_tolerated():
    updated, _ = apply_operations(
        base(),
        [
            Operation(op="remove", id="d1"),
            Operation(op="move", id="없는-id", bucket="decided"),
            Operation(op="add", bucket=None, text="칸 없음"),
        ],
    )
    assert updated.decided == []
    assert [i.id for i in updated.undecided] == ["u1"]


def test_duplicate_add_is_ignored_and_original_untouched():
    original = base()
    updated, changed = apply_operations(original, [Operation(op="add", bucket="decided", text="테스트 참가자는 5명")])
    assert len(updated.decided) == 1 and changed == set()
    assert updated == original


def test_describe_lists_ids_for_prompt():
    text = describe(base())
    assert "[d1] (decided) 테스트 참가자는 5명" in text
    assert "[u1] (undecided) 발표 날짜" in text
